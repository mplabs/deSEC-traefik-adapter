const assert = require('assert')
const { getInfix } = require('./util')


const candidates = [{
  candidate: 'foobar.dedyn.io.',
  expected: ''
}, {
  candidate: 's3.foobar.dedyn.io.',
  expected: '.s3'
}, {
  candidate: '*.foobar.dedyn.io.',
  expected: ''
}, {
  candidate: '*.s3.foobar.dedyn.io.',
  expected: '.s3'
}]

candidates.forEach(({ candidate, expected }) => {
  let result

  it(`should resolve '${candidate}' to '${expected}'`, () => {
    result = getInfix('foobar.dedyn.io', candidate)
    assert.equal(result, expected, `Expected ${expected}, but found ${result}`)
  })
})
