const axios = require('axios')

const { get, splitFqdn } = require('./util')

const DESEC_URL = 'https://desec.io/api/v1'

module.exports = ({ token } = {}) => {
  if (!token) {
    throw new Error('Required token was not supplied')
  }

  const api = axios.create({
    baseURL: DESEC_URL,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `token ${token}`,
    },
    responseType: 'json',
  })

  // ponytail: deSEC returns up to 500 zones per page and refetches per request.
  // Paginate / memoize if you ever run more zones or more traffic than that.
  this.zoneFor = (fqdn) =>
    api.get('/domains/').then(({ data }) => {
      const { domain, subdomain } = splitFqdn(
        fqdn,
        data.map(({ name }) => name)
      )
      const zone = data.find(({ name }) => name.toLowerCase() === domain)

      return { domain, subdomain, minimumTtl: get(zone, 'minimum_ttl', 3600) }
    })

  this.current = ({ domain, subdomain }) =>
    api
      .get(`/domains/${domain}/rrsets?subname=${subdomain}&type=TXT`)
      .then(({ data }) => get(data, 'records', []))

  this.delete = ({ domain, subdomain }) =>
    api.delete(`/domains/${domain}/rrsets/${subdomain}/TXT/`)

  this.update = ({ domain, subdomain, records, minimumTtl }) =>
    api.put(`/domains/${domain}/rrsets/`, [
      {
        subname: subdomain,
        type: 'TXT',
        records,
        ttl: minimumTtl,
      },
    ])

  return this
}
