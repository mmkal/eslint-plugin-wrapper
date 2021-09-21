import type * as eslint from 'eslint'

export interface Plugin {
  rules: Record<string, eslint.Rule.RuleModule>
  configs?: Record<string, eslint.Linter.Config>
  processors?: Record<string, eslint.Linter.Processor>
  environments?: Record<string, {
    globals: Record<string, boolean>
    parserOptions: eslint.Linter.ParserOptions
  }>
}

declare class EslintPluginWrapper {
  constructor(opts: {pluginName: string})

  readonly plugins: Record<string, Plugin>

  addPlugins(plugins: Record<string, Plugin>): void

  get EslintPluginWrapper(): typeof EslintPluginWrapper

  get rules(): NonNullable<Plugin['rules']>
  get configs(): NonNullable<Plugin['configs']>
  get processors(): NonNullable<Plugin['processors']>
  get environments(): NonNullable<Plugin['environments']>

  protected buildRules(): NonNullable<Plugin['rules']>
  protected buildConfigs(): NonNullable<Plugin['configs']>
  protected buildProcessors(): NonNullable<Plugin['processors']>
  protected buildEnvironments(): NonNullable<Plugin['environments']>
}

declare const eslintPluginWrapper: EslintPluginWrapper

export = eslintPluginWrapper
