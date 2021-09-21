# eslint-plugin-wrapper

Write project-specific rules, in your own eslint config file.

## Installation

```
npm install eslint-plugin-wrapper
```

## Usage

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
