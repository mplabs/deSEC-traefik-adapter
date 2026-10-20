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

describe('basicAuth', () => {
  const credentials = { user: 'traefik', password: 'p:ssw0rd' }
  const header = (user, password) =>
    `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`

  let res, next

  const call = (authorization, options = credentials) => {
    res = { set: jest.fn(() => res), sendStatus: jest.fn() }
    next = jest.fn()
    require('./util').basicAuth(options)({ headers: { authorization } }, res, next)
  }

  it('should pass through when no credentials are configured', () => {
    call(undefined, {})
    expect(next).toHaveBeenCalled()
  })

  it('should accept correct credentials, colons in the password included', () => {
    call(header('traefik', 'p:ssw0rd'))
    expect(next).toHaveBeenCalled()
    expect(res.sendStatus).not.toHaveBeenCalled()
  })

  it.each([
    ['a wrong password', header('traefik', 'nope')],
    ['a wrong user', header('nobody', 'p:ssw0rd')],
    ['a missing header', undefined],
    ['a non-basic scheme', 'Bearer sometoken'],
    ['garbage', 'Basic not-base64!!'],
  ])('should reject %s', (_, authorization) => {
    call(authorization)
    expect(next).not.toHaveBeenCalled()
    expect(res.sendStatus).toHaveBeenCalledWith(401)
    expect(res.set).toHaveBeenCalledWith('WWW-Authenticate', expect.any(String))
  })
})
