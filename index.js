class EslintPluginWrapper {
  /** @param {{pluginName: string}} opts */
  constructor(opts) {
    this.pluginName = opts.pluginName

    /** @type {Record<string, import('.').Plugin>} */
    this.plugins = {}

    this.addPlugins({
      default: {
        rules: {
          'not-setup': {
            create: context => {
              context.report({
                message:
                  'You must call `dynamic.add(...)` before using this plugin',
                loc: {line: 1, column: 0},
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
    delete this.plugins.default
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
 * @param {Record<string, import('.').Plugin>} plugins
 * @param {(opts: {pluginName: string; plugin: import('.').Plugin; ruleName: string; rule: import('eslint').Rule.RuleModule}) => [string, any]} getEntry
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

module.exports = new EslintPluginWrapper({pluginName: 'dynamic'})
