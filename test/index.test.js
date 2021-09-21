const wrapper = require('..')
const prettier = require('eslint-plugin-prettier')

test('wrapper', () => {
  wrapper.addPlugins({
    foo: {
      rules: {
        bar: {
          create: context => {
            return {
              Literal: node => {
                context.report({message: 'hello', node})
              },
            }
          },
        },
      },
    },
    prettier,
  })

  expect(wrapper.configs.all).toMatchInlineSnapshot(`
    Object {
      "rules": Object {
        "wrapper/foo/bar": "error",
        "wrapper/prettier/prettier": "error",
      },
    }
  `)

  expect(wrapper.configs['all.warn']).toMatchInlineSnapshot(`
    Object {
      "rules": Object {
        "wrapper/foo/bar": "warn",
        "wrapper/prettier/prettier": "warn",
      },
    }
  `)

  expect(wrapper.configs.recommended).toMatchInlineSnapshot(`
    Object {
      "rules": Object {
        "arrow-body-style": "off",
        "prefer-arrow-callback": "off",
        "wrapper/prettier/prettier": "error",
      },
    }
  `)

  expect(wrapper.rules['foo/bar']).toMatchObject({
    create: expect.any(Function),
  })

  expect(wrapper.rules['prettier/prettier']).toMatchObject({
    create: expect.any(Function),
  })
})
