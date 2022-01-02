class EslintPluginWrapper {
  /** @param {{pluginName: string}} opts */
  constructor(opts) {
    this.pluginName = opts.pluginName

    /** @type {Record<string, import('.').Plugin>} */
    this.plugins = {}

    this.addPlugins({
      default: {
        configs: {
          recommended: {
            rules: {
              'default/eslint-comments': 'error',
            },
          },
        },
        rules: {
          'eslint-comments': {
            meta: {
              docs: {
                description:
                  'Detect and fix incorrectly-prefixed wrapped rules',
                url: 'https://github.com/mmkal/eslint-plugin-wrapper#README',
                recommended: true,
              },
              fixable: 'code',
              schema: [
                {
                  type: 'object',
                  properties: {
                    directives: {
                      type: 'array',
                      items: {type: 'string'},
                    },
                    prefixReplacements: {
                      type: 'object',
                    },
                  },
                },
              ],
            },
            create: context => {
              const comments = context.getSourceCode().getAllComments()
              const directives = (context.options &&
                context.options[0] &&
                context.options[0].directives) || [
                'eslint-disable',
                'eslint-enable',
                'eslint-disable-next-line',
              ]
              comments.forEach(c => {
                const matchedDirective = directives.find(d =>
                  c.value.trim().startsWith(d + ' '),
                )

                if (!matchedDirective) {
                  return {}
                }

                /** @type {Record<string, string>} */
                const prefixReplacements = {
                  ...Object.fromEntries(
                    Object.keys(this.plugins).map(pluginName => [
                      `${pluginName}/`,
                      `${this.pluginName}/${pluginName}/`,
                    ]),
                  ),
                  ...(context.options &&
                    context.options[0] &&
                    context.options[0].prefixReplacements),
                }
                const updatedComment = Object.entries(prefixReplacements)
                  .sort((a, b) => b[0].length - a[0].length)
                  .reduce((comment, [withoutPrefix, withPrefix]) => {
                    return comment
                      .split(' ' + withoutPrefix)
                      .join(' ' + withPrefix)
                  }, c.value)

                if (updatedComment !== c.value) {
                  context.report({
                    message: `eslint comment incorrectly prefixed. Replace "${c.value.trim()}" with "${updatedComment.trim()}"`,
                    loc: c.loc,
                    fix: fixer =>
                      fixer.replaceTextRange(
                        [
                          c.range[0] + 2,
                          c.type === 'Block' ? c.range[1] - 2 : c.range[1],
                        ],
                        updatedComment,
                      ),
                  })
                }
              })
              return {}
            },
          },
        },
      },
    })
  }

  get EslintPluginWrapper() {
    return EslintPluginWrapper
  }

  get rules() {
    return this.buildRules()
  }

  get configs() {
    return this.buildConfigs()
  }

  get processors() {
    return this.buildProcessors()
  }

  get environments() {
    return this.buildEnvironments()
  }

  /** @param {Record<string, import('.').Plugin>} plugins */
  addPlugins(plugins) {
    Object.assign(this.plugins, plugins)
  }

  /** Given a rule info, get the correct string reference for it in a config (i.e. must include this plugin's name prefix) */
  configRuleReference(info) {
    return `${this.pluginName}/${info.pluginName}/${info.ruleName}`
  }

  buildRules() {
    return ruleDict(this.plugins, opts => [
      `${opts.pluginName}/${opts.ruleName}`,
      opts.rule,
    ])
  }

  buildConfigs() {
    const configs = {}
    Object.defineProperty(configs, 'all', {
      configurable: true,
      enumerable: true,
      get: () => {
        return {
          rules: ruleDict(this.plugins, opts => [
            this.configRuleReference(opts),
            'error',
          ]),
        }
      },
    })
    Object.defineProperty(configs, 'all.warn', {
      configurable: true,
      enumerable: true,
      get: () => {
        return {
          rules: ruleDict(this.plugins, opts => [
            this.configRuleReference(opts),
            'warn',
          ]),
        }
      },
    })

    Object.defineProperty(configs, 'recommended', {
      configurable: true,
      enumerable: true,
      get: () => {
        return {
          rules: Object.assign(
            {},
            ...Object.entries(this.plugins).map(([pluginName, plugin]) => {
              const config = plugin.configs && plugin.configs.recommended
              if (!config || !config.rules) {
                return null
              }

              return Object.fromEntries(
                Object.entries(config.rules).map(([key, val]) =>
                  key.startsWith(pluginName)
                    ? [`${this.pluginName}/${key}`, val]
                    : [key, val],
                ),
              )
            }),
          ),
        }
      },
    })

    Object.entries(this.plugins).forEach(([pluginName, plugin]) => {
      Object.entries(plugin.configs || {}).forEach(([configName, config]) => {
        Object.defineProperty(configs, `${pluginName}.all`, {
          configurable: true,
          enumerable: true,
          get: () => ({
            rules: ruleDict({[pluginName]: plugin}, opts => [
              this.configRuleReference(opts),
              'error',
            ]),
          }),
        })
        Object.defineProperty(configs, `${pluginName}.all.warn`, {
          configurable: true,
          enumerable: true,
          get: () => ({
            rules: ruleDict({[pluginName]: plugin}, opts => [
              this.configRuleReference(opts),
              'warn',
            ]),
          }),
        })

        Object.defineProperty(configs, `${pluginName}.${configName}`, {
          configurable: true,
          enumerable: true,
          get: () => {
            return {
              // don't do ...config, it's not really possible to support plugins' configs extending other configs
              // especially with the crazy eslint naming conventions.
              rules: Object.fromEntries(
                Object.entries(config.rules).map(([key, val]) =>
                  key.startsWith(pluginName)
                    ? [`${this.pluginName}/${key}`, val]
                    : [key, val],
                ),
              ),
            }
          },
        })
      })
    })

    return configs
  }

  buildProcessors() {
    return Object.assign(
      {},
      ...Object.values(this.plugins).map(plugin => plugin.processors),
    )
  }

  buildEnvironments() {
    return Object.assign(
      {},
      ...Object.values(this.plugins).map(plugin => plugin.environments),
    )
  }
}

/**
 * For a dictionary of plugins and a function to get entries, build a dictionary of rules.
 *
 * @type {<T>(plugins: Record<string, import('.').Plugin>, getEntry: (opts: {pluginName: string; plugin: import('.').Plugin; ruleName: string; rule: import('eslint').Rule.RuleModule}) => [string, T]) => Record<string, T>}
 */
function ruleDict(plugins, getEntry) {
  return Object.assign(
    {},
    ...Object.entries(plugins).map(([pluginName, plugin]) =>
      Object.fromEntries(
        Object.entries(plugin.rules || {}).map(([ruleName, rule]) =>
          getEntry({pluginName, pluginName, ruleName, rule}),
        ),
      ),
    ),
  )
}

module.exports = new EslintPluginWrapper({pluginName: 'wrapper'})
