# eslint-plugin-dynamic

Write project-specific rules, in your own eslint config file.

## Installation

```
npm install eslint-plugin-dynamic
```

## Usage

In your `.eslintrc.js` file:

```js
const eslintPluginDynamic = require('eslint-plugin-dynamic')

eslintPluginDynamic.addPlugins({
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
  plugins: ['dynamic'],
  extends: ['plugin:dynamic/all'],
}
```

Your codebase will now be linted with the `no-literals` rule.
