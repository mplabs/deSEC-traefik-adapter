require('dotenv').config()

const axios = require('axios')
const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')

const { ash, get, getInfix } = require('./libs/util')

const {
  HOST = '0.0.0.0',
  PORT = 1337,
  DESEC_URL = 'https://desec.io/api/v1/',
  DEDYN_TOKEN,
  DEDYN_NAME,
} = process.env

let minimum_ttl

const app = express()

const request = axios.create({
  baseURL: DESEC_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `token ${DEDYN_TOKEN}`,
  },
  responseType: 'json',
  validateStatus: (status) => status >= 200 && status < 300,
})

app.use(bodyParser.json())
app.use(logger('dev'))

app.use((req, res, next) => {
  if (!(DEDYN_NAME && DEDYN_TOKEN)) {
    res.status(400).send('Bad Request')
  } else {
    next()
  }
})

app.post(
  '/present',
  ash(async (req, res) => {
    const { fqdn, value } = req.body

    const currentRrsets = await getCurrentRrsets(DEDYN_NAME, fqdn)

    const rrset = {
      subname: `_acme-challenge${getInfix(DEDYN_NAME, fqdn)}`,
      type: 'TXT',
      records: [...get(currentRrsets, 'records', []), `\"${value}\"`],
      ttl: minimum_ttl,
    }

    if (currentRrsets) {
      await updateRrset(DEDYN_NAME, rrset)
    } else {
      await addRrset(DEDYN_NAME, rrset)
    }

    res.sendStatus(201)
  })
)

// Remove matching rrsets
app.post(
  '/cleanup',
  ash(async (req, res) => {
    const { fqdn } = req.body

    const rrset = {
      subname: `_acme-challenge${getInfix(DEDYN_NAME, fqdn)}`,
      type: 'TXT',
    }

    await deleteRrset(DEDYN_NAME, rrset)

    res.sendStatus(204)
  })
)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.sendStatus(500)
})

app.listen(PORT, HOST, async () => {
  try {
    minimum_ttl = await getMinimumTTL(DEDYN_NAME)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  console.log(`
minimum_ttl is ${minimum_ttl}

Server started on ${HOST}:${PORT}...
`)
})

async function getCurrentRrsets(domainName, fqdn) {
  return await request.get(
    `domains/${domainName}/rrsets?subname=${fqdn}&type=TXT`,
    { transformResponse: (data) => get(data, 'records') }
  )
}

async function getMinimumTTL(domainName) {
  try {
    const { data } = await request.get(`domains/${domainName}/`)
    return get(data, 'minimum_ttl')
  } catch (e) {
    throw e
  }
}

async function addRrset(domainName, rrset) {
  try {
    const { data } = await request.post(`domains/${domainName}/rrsets/`, rrset)
    return data
  } catch (e) {
    throw new Error(`Could not add rrset`)
  }
}

async function deleteRrset(domainName, rrset) {
  return await request.delete(
    `domains/${domainName}/rrsets/${rrset.subname}/${rrset.type}/`
  )
}

function updateRrset(domainName, rrset) {
  return new Promise((resolve, reject) => {
    request.put(
      `domains/${domainName}/rrsets/${rrset.subname}/${rrset.type}/`,
      rrset
    )
  })
}
