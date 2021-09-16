class DynamicPlugin {
  constructor() {
    // default setup, aggressively warn user that they've failed to set the plugin up properly
    this.plugin = {
      rules: {
        /** @param {import('eslint').Rule.RuleContext} context  */
        'bad-setup': {
          create: context => {
            context.report({
              message: 'You must call `dynamic.plugin = ...` before using this plugin',
              loc: {line: 1, column: 0},
            })
            return {}
          },
        },
      },
    }
  }

  get rules() {
    return this.plugin.rules
  }
  get configs() {
    const configs = this.plugin.configs || {}
    const rules = Object.keys(this.plugin.rules || {})
    return {
      ...configs,
      all: {
        rules: {
          ...Object.fromEntries(rules.map(rule => ['dynamic/' + rule, 'error'])),
          ...(configs.all && configs.all.rules),
        },
        ...configs.all,
      },
      warnings: {
        rules: {
          ...Object.fromEntries(rules.map(rule => ['dynamic/' + rule, 'warn'])),
          ...(configs.warnings && configs.warnings.rules),
        },
        ...configs.warnings,
      },
    }
  }
  get processors() {
    return this.plugin.processors
  }
  get environments() {
    return this.plugin.environments
  }
}

module.exports = new DynamicPlugin()
