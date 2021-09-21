const wrapper = require('..')
const prettier = require('eslint-plugin-prettier')
const eslint = require('eslint')

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
        "wrapper/default/eslint-comments": "error",
        "wrapper/foo/bar": "error",
        "wrapper/prettier/prettier": "error",
      },
    }
  `)

  expect(wrapper.configs['all.warn']).toMatchInlineSnapshot(`
    Object {
      "rules": Object {
        "wrapper/default/eslint-comments": "warn",
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
        "wrapper/default/eslint-comments": "error",
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

const ruleTester = new eslint.RuleTester()

ruleTester.run(
  'default/eslint-comments',
  wrapper.rules['default/eslint-comments'],
  {
    valid: [
      '// test',
      {
        code: '// test-directive wrapper/default/eslint-comments',
        options: [{directives: ['test-directive']}], // can't use actual eslint-disable directives cos they turn the rule off
      },
      {
        code: '// test-directive wrapper/default/eslint-comments, no-undef',
        options: [{directives: ['test-directive']}],
      },
      'var foo = 1',
      {
        code: '/* test-directive no-undef, wrapper/default/eslint-comments, no-undef */',
        options: [{directives: ['test-directive']}],
      },
    ],
    invalid: [
      {
        code: '// eslint-disable-next-line default/eslint-comments',
        errors: [{message: /eslint comment incorrectly prefixed/}],
        output: '// eslint-disable-next-line wrapper/default/eslint-comments',
      },
      {
        code: '// eslint-disable-next-line default/eslint-comments, no-undef',
        errors: [{message: /eslint comment incorrectly prefixed/}],
        output:
          '// eslint-disable-next-line wrapper/default/eslint-comments, no-undef',
      },
      {
        code: '// eslint-disable-next-line no-undef, default/eslint-comments, no-undef',
        errors: [{message: /eslint comment incorrectly prefixed/}],
        output:
          '// eslint-disable-next-line no-undef, wrapper/default/eslint-comments, no-undef',
      },
      {
        code: '/* eslint-enable no-undef, default/eslint-comments, no-undef */',
        errors: [{message: /eslint comment incorrectly prefixed/}],
        output:
          '/* eslint-enable no-undef, wrapper/default/eslint-comments, no-undef */',
      },
      {
        code: '// test-directive wrapper/some-plugin/foo',
        options: [
          {
            directives: ['test-directive'],
            prefixReplacements: {'wrapper/some-plugin/': 'some-plugin/'},
          },
        ],
        errors: [{message: /eslint comment incorrectly prefixed/}],
        output: '// test-directive some-plugin/foo',
      },
    ],
  },
)
