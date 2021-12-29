# eslint-plugin-wrapper

Write project-specific rules, in your own eslint config file.

## Installation

```
npm install eslint-plugin-wrapper
```

## Usage

### Project-specific rules

In your `.eslintrc.js` file:

```js
const wrapper = require('eslint-plugin-wrapper')

wrapper.addPlugins({
  'my-project': {
    rules: {
      'no-literals': {
        create: context => {
          return {
            Literal: node => {
              context.report({
                message: `Don't use literals for some reason!`,
                node,
              })
            }
          }
        }
      }
    }
  }
})

module.exports = {
  plugins: ['wrapper'],
  extends: ['plugin:wrapper/all'],
}
```

Your codebase will now be linted with the `no-literals` rule.

### Wrap external plugins and configs

You can also use this to wrap external eslint plugins and configs. This is essentially a workaround to [eslint imposing awkward peer dependency requirements on plugins and configs](https://github.com/eslint/eslint/issues/3458), which is legal now, until [supported in eslint](https://github.com/eslint/eslint/issues/13481).

For example, you could create a package internal to your company, say called `@yourcompany/eslint-plugin'`. Then, in its `main` module:

```js
const {EslintPluginWrapper} = require('eslint-plugin-wrapper')

const wrapper = new EslintPluginWrapper({pluginName: '@yourcompany'})

wrapper.addPlugins({
  unicorn: require('eslint-plugin-unicorn'),
})

wrapper.addPlugins({
  'config:xo': {configs: {recommended: require('eslint-config-xo')}},
})

wrapper.addPlugins({
  default: {
    rules: {
      'no-literals': ...,
    },
    configs: {
      recommended: {
        plugins: ['@yourcompany'],
        extends: ['plugin:@yourcompany/recommended'],
        rules: {
          '@yourcompany/default/no-literals': 'error',
          '@hidrb/unicorn/no-nested-ternary': 'off',
        }
      }
    }
  }
})

module.exports = wrapper
```

Then in a downstream project, you only need _one_ eslint plugin dependency, `@yourcompany/eslint-plugin`, which in this case will give you all of the `eslint-plugin-unicorn` rules, and all of the `eslint-config-xo` recommendations:

```js
module.exports = require('@yourcompany/eslint-plugin').plugins.default.configs.recommended
```

Some notes on the above config:

- the "recommended" config will merge the "recommended" rules in all internal plugins - so in this case, the recommended rules for eslint-plugin-unicorn.
- `wrapper.addPlugins({ ... })` is also being used to add _configs_. Since plugins are allowed to contain configs, we can just use a convention of a `config:` prefix and use the same method.
- the `default` plugin defines project-specific rules, and overrides for recommended configs for external libraries. You can customise this to your heart's content.

#### Alternatives

Note that some other workarounds exist, but they require shimming, e.g. [@rushstack/eslint-config](https://www.npmjs.com/package/@rushstack/eslint-config). It gets unclear where the patch to eslint's weird module resolution should happen, or how it works. There is a bit less magic in this library. Basically, you only need one plugin, the wrapper. And the wrapper just-so-happens to rely on some other node libraries to implement its rules (and those node libraries just-so-happen to be eslint plugins themselves).

### Multiple versions of a library

You could use this to pick rules from different published versions of a single library. In package.json:

```json
  "dependencies": {
    ...,
    "eslint-plugin-unicorn_37": "npm:eslint-plugin-unicorn@37.0.0",
    "eslint-plugin-unicorn_39": "npm:eslint-plugin-unicorn@39.0.0"
  }
```

Then in `.eslintrc.js`:

```js
const unicorn37 = require('eslint-plugin-unicorn_37')
const unicorn39 = require('eslint-plugin-unicorn_39')

wrapper.addPlugin({
  unicorn: {
    ...unicorn39,
    rules: {
      ...unicorn39.rules,
      'template-indent': unicorn37.rules['template-indent'],
    },
  },
})
```
