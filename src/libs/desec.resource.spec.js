const axios = require('axios')

const Resource = require('./desec.resource')

jest.mock('axios')

const mockAxios = jest.createMockFromModule('axios')
axios.create = jest.fn(() => mockAxios)

describe('deSEC resource', () => {
  const domain = 'example.com'
  const subdomain = '_acme-challenge.testing'
  const mockToken = 'mock-token'
  let resource, mockRrset

  beforeEach(() => {
    resource = Resource({ token: mockToken })
    mockRrset = { subname: subdomain, type: 'TXT', records: [], ttl: 1234 }
  })

  it('should require token', () => {
    expect(() => {
      Resource()
    }).toThrow('Required token was not supplied')
  })

  it('should setup axios', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'https://desec.io/api/v1',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `token ${mockToken}`,
      },
      responseType: 'json',
    })
  })

  it('should resolve the owning zone, subname and ttl for an fqdn', async () => {
    const resp = {
      data: [
        { name: 'example.com', minimum_ttl: 3600 },
        { name: 'testing.example.com', minimum_ttl: 1234 },
      ],
    }

    mockAxios.get.mockImplementationOnce(() => Promise.resolve(resp))

    const response = await resource.zoneFor('_acme-challenge.*.testing.example.com.')
    expect(mockAxios.get).toHaveBeenCalledWith('/domains/')
    expect(response).toEqual({
      domain: 'testing.example.com',
      subdomain: '_acme-challenge',
      minimumTtl: 1234,
    })
  })

  it('should reject an fqdn outside the owned zones', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({ data: [{ name: 'example.com', minimum_ttl: 3600 }] })
    )

    await expect(resource.zoneFor('_acme-challenge.elsewhere.net.')).rejects.toThrow(
      'No deSEC zone owns'
    )
  })

  it('should get current domain data', async () => {
    const resp = { data: { records: [mockRrset] } }

    mockAxios.get.mockImplementationOnce(() => Promise.resolve(resp))

    const response = await resource.current({ domain, subdomain })
    expect(mockAxios.get).toHaveBeenCalledWith(
      `/domains/${domain}/rrsets?subname=${subdomain}&type=TXT`
    )
    expect(response).toEqual([mockRrset])
  })

  it('should delete rrset', async () => {
    mockAxios.delete.mockImplementationOnce(() => Promise.resolve())

    await resource.delete({ domain, subdomain })
    expect(mockAxios.delete).toHaveBeenCalledWith(
      `/domains/${domain}/rrsets/${subdomain}/TXT/`
    )
  })

  it('should update rrset', async () => {
    const rrset = {
      ...mockRrset,
      records: ['"abcdef1234567890"'],
    }

    mockAxios.put.mockImplementationOnce(() => Promise.resolve())

    await resource.update({
      domain,
      subdomain,
      records: ['"abcdef1234567890"'],
      minimumTtl: 1234,
    })
    expect(mockAxios.put).toHaveBeenCalledWith(`/domains/${domain}/rrsets/`, [
      rrset,
    ])
  })
})
