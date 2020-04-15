const { getInfix } = require('./util')


const candidates = [{
  candidate: '_acme-challenge.foobar.dedyn.io.',
  expected: ''
}, {
  candidate: '_acme-challenge.s3.foobar.dedyn.io.',
  expected: '.s3'
}, {
  candidate: '_acme-challenge.*.foobar.dedyn.io.',
  expected: ''
}, {
  candidate: '_acme-challenge.*.s3.foobar.dedyn.io.',
  expected: '.s3'
}]

candidates.forEach(({ candidate, expected }) => {
  let result

  it(`should resolve '${candidate}' to '${expected}'`, () => {
    result = getInfix('foobar.dedyn.io', candidate)

    expect(result).toEqual(expected)
  })
})
