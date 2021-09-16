const defaultPluginKey = Symbol('defaultPluginKey')

class DynamicPlugin {
  constructor() {
    /** @type {Record<string, typeof import('./index')>} */
    // if no plugins are added, aggressively warn user that they've failed to set the plugin up properly
    this.plugins = {
      [defaultPluginKey]: {
        rules: {
          /** @param {import('eslint').Rule.RuleContext} context  */
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
    }
  }

  /** @param {Record<string, typeof import('./index')>} plugins */
  add(plugins) {
    delete this.plugins[defaultPluginKey]
    Object.assign(this.plugins, plugins)
  }

  /** @param {(opts: {pluginName: string; plugin: typeof import('./index'); ruleName: string; rule: import('eslint').Rule.RuleModule})} getValue */
  _buildRules(plugins, getEntry) {
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

  get rules() {
    return this._buildRules(this.plugins, opts => [opts.ruleName, opts.rule])
  }
  get configs() {
    return {
      all: {
        rules: this._buildRules(this.plugins, opts => [
          `dynamic/${opts.ruleName}`,
          'error',
        ]),
      },
      warnings: {
        rules: this._buildRules(this.plugins, opts => [
          `dynamic/${opts.ruleName}`,
          'warn',
        ]),
      },
      ...Object.fromEntries(
        Object.keys(this.plugins).map(pluginName => [
          `${pluginName}.all`,
          {
            rules: this._buildRules(
              {[pluginName]: this.plugins[pluginName]},
              opts => [`dynamic/${opts.ruleName}`, 'error'],
            ),
          },
        ]),
      ),
      ...Object.fromEntries(
        Object.keys(this.plugins).map(pluginName => [
          `${pluginName}.all.warn`,
          {
            rules: this._buildRules(
              {[pluginName]: this.plugins[pluginName]},
              opts => [`dynamic/${opts.ruleName}`, 'warn'],
            ),
          },
        ]),
      ),
    }
  }
  get processors() {
    return {}
    // return this.plugins[*].processors
  }
  get environments() {
    return {}
    // return this.plugin[*].environments
  }
}

module.exports = new DynamicPlugin()
