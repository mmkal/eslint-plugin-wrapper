const defaultPluginKey = Symbol('defaultPluginKey')

class DynamicPlugin {
  constructor() {
    /** @type {Record<string, typeof import('./index.d')>} */
    // by default aggressively warn user that they've failed to set the plugin up properly
    this.plugins = {
      [defaultPluginKey]: {
        rules: {
          /** @param {import('eslint').Rule.RuleContext} context  */
          'bad-setup': {
            create: context => {
              context.report({
                message:
                  'You must call `dynamic.plugin = ...` before using this plugin',
                loc: {line: 1, column: 0},
              })
              return {}
            },
          },
        },
      },
    }
  }

  /**
   * @param {{name: string}} options
   * @param {typeof import('./index')} plugin
   */
  addPlugin(options, plugin) {
    delete this.plugins[defaultPluginKey]
    this.plugins[options.name] = plugin
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
          `${pluginName}.warnings`,
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
    return this.plugin.processors
  }
  get environments() {
    return {}
    return this.plugin.environments
  }
}

module.exports = new DynamicPlugin()
