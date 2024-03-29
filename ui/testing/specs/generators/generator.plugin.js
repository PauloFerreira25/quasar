import readAssociatedJsonFile from '../readAssociatedJsonFile.js'
import {
  getDefTesting,
  getExpectOneOfTypes
} from '../specs.utils.js'

const identifiers = {
  injection: {
    categoryId: '[Injection]',
    createTestFn: createInjection
  },

  quasarConfOptions: {
    categoryId: '[QuasarConfOptions]',
    createTestFn: createQuasarConfOptions
  },

  props: {
    categoryId: '[Props]',
    getTestId: name => `[(prop)${ name }]`,
    createTestFn: createPropTest
  },

  methods: {
    categoryId: '[Methods]',
    getTestId: name => `[(method)${ name }]`,
    createTestFn: createMethodTest
  }
}

function getInjectionTest ({ jsonEntry, json, ctx }) {
  const target = jsonEntry.substring(3) // strip '$q.'

  if (json.props?.[ target ] !== void 0) {
    return getExpectOneOfTypes({
      jsonEntry: json.props[ target ],
      ref: jsonEntry
    })
  }

  const accessor = json.methods?.create !== void 0
    ? '.create'
    : ''

  return `expect(${ jsonEntry }).toBe(${ ctx.pascalName }${ accessor })`
}

function createInjection ({ categoryId, jsonEntry, json, ctx }) {
  const testType = getInjectionTest({ jsonEntry, json, ctx })

  return `
  describe('${ categoryId }', () => {
    test('is injected into $q', () => {
      let $q

      mount(
        defineComponent({
          template: '<div></div>',
          setup (props) {
            $q = useQuasar()
            return {}
          }
        })
      )

      ${ testType }
    })
  })\n`
}

function createQuasarConfOptions ({ categoryId, _jsonEntry, _ctx }) {
  // TODO: implement
  return `
  describe('${ categoryId }', () => {
    test.todo('definition', () => {
      //
    })
  })\n`
}

function getReactiveTest ({ jsonEntry, ref }) {
  if (jsonEntry.reactive !== true) {
    return ''
  }

  return `\n
      test.todo('is reactive', () => {
        const val = ${ ref }

        // TODO: trigger something to test reactivity

        expect(${ ref }).not.toBe(val)
      })`
}

function createPropTest ({
  name,
  pascalName,
  testId,
  jsonEntry,
  json,
  ctx
}) {
  const ref = `${ ctx.pascalName }.${ pascalName }`

  const typeTest = getExpectOneOfTypes({ jsonEntry, ref })
  const reactiveTest = getReactiveTest({ jsonEntry, ref })

  return `
    describe('${ testId }', () => {
      test('is correct type', () => {
        ${ typeTest }
      })${ reactiveTest }
    })\n`
}

function createMethodTest ({
  pascalName,
  testId,
  jsonEntry,
  json,
  ctx
}) {
  const { expectType } = getDefTesting({ ...jsonEntry, type: 'Function' })
  const typeTest = expectType(
    `${ ctx.pascalName }.${ pascalName }`,
    { withCall: true }
  )

  return `
    describe('${ testId }', () => {
      test.todo('should be callable', () => {
        ${ typeTest }

        // TODO: test the effect
      })
    })\n`
}

export default {
  identifiers,
  getJson: readAssociatedJsonFile,
  getFileHeader: ({ ctx, json }) => {
    const acc = [
      'import { describe, test, expect } from \'vitest\''
    ]

    if (json.injection !== void 0) {
      acc.push(
        'import { mount } from \'@vue/test-utils\'',
        'import { useQuasar } from \'quasar\'',
        'import { defineComponent } from \'vue\''
      )
    }

    acc.push(
      '',
      `import ${ ctx.pascalName } from './${ ctx.localName }'`
    )

    return acc.join('\n')
  }
}
