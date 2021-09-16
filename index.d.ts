import type * as eslint from 'eslint'

declare const dynamicPlugin: {
  plugin: {
    rules: Record<string, eslint.Rule.RuleModule>
    configs?: Record<string, eslint.Linter.Config>
    processors?: Record<string, eslint.Linter.Processor>
    environments?: Record<string, {
      globals: Record<string, boolean>
      parserOptions: eslint.Linter.ParserOptions
    }>
  }
}

export = dynamicPlugin
