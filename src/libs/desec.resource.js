const axios = require('axios')

const { get } = require('./util')

const DESEC_URL = 'https://desec.io/api/v1/'

module.exports = ({ domainName, token }) => {
  if (!(token || domainName)) {
    throw new Error('Required domainName or token were not supplied')
  }

  const api = axios.create({
    baseURL: `${DESEC_URL}domains/${domainName}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `token ${token}`,
    },
    responseType: 'json',
  })

  this.minimumTtl = () =>
    api.get(`/`).then(({ data }) => get(data, 'minimum_ttl', 3600))

  this.current = (subname) =>
    api
      .get(`/rrsets?subname=_acme-challenge${subname}&type=TXT`)
      .then(({ data }) => get(data, 'records', []))

  this.delete = (subname) =>
    api.delete(`/rrsets/_acme-challenge${subname}/TXT/`)

  this.update = (subname, records, minimumTtl) =>
    api.put(`/rrsets/`, [
      {
        subname: `_acme-challenge${subname}`,
        type: 'TXT',
        records,
        ttl: minimumTtl,
      },
    ])

  return this
}
