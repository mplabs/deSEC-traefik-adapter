const { splitFqdn } = require('./util')

const zones = ['mplabs.cloud', 'foobar.dedyn.io', 's3.mplabs.cloud']

const candidates = [{
  candidate: '_acme-challenge.foobar.dedyn.io.',
  expected: { domain: 'foobar.dedyn.io', subdomain: '_acme-challenge' }
}, {
  candidate: '_acme-challenge.www.foobar.dedyn.io.',
  expected: { domain: 'foobar.dedyn.io', subdomain: '_acme-challenge.www' }
}, {
  candidate: '_acme-challenge.*.foobar.dedyn.io.',
  expected: { domain: 'foobar.dedyn.io', subdomain: '_acme-challenge' }
}, {
  candidate: '_ACME-Challenge.WWW.MPLabs.Cloud',
  expected: { domain: 'mplabs.cloud', subdomain: '_acme-challenge.www' }
}, {
  // the deeper zone wins over its parent
  candidate: '_acme-challenge.*.s3.mplabs.cloud.',
  expected: { domain: 's3.mplabs.cloud', subdomain: '_acme-challenge' }
}]

candidates.forEach(({ candidate, expected }) => {
  it(`should resolve '${candidate}' to ${JSON.stringify(expected)}`, () => {
    expect(splitFqdn(candidate, zones)).toEqual(expected)
  })
})

it('should reject an fqdn in no owned zone', () => {
  expect(() => splitFqdn('_acme-challenge.example.com.', zones)).toThrow(
    'No deSEC zone owns'
  )
})

it('should reject a bare zone with no subname', () => {
  expect(() => splitFqdn('mplabs.cloud.', zones)).toThrow('No deSEC zone owns')
})
