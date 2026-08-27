require('dotenv').config()

const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')

const { ash } = require('./libs/util')
const Resource = require('./libs/desec.resource')

const {
  HOST = '127.0.0.1',
  PORT = 1337,
  DEDYN_TOKEN,
  NODE_ENV,
} = process.env

if (!DEDYN_TOKEN) {
  throw new Error('Set DEDYN_TOKEN as environment variable.')
}

const resource = Resource({ token: DEDYN_TOKEN })

const app = express()

app.use(bodyParser.json())
app.use(logger(NODE_ENV === 'production' ? 'tiny' : 'dev'))

// Routes
app.post(
  '/present',
  ash(async (req, res, next) => {
    const { fqdn, value } = req.body

    const token = `\"${value}\"`
    const { domain, subdomain, minimumTtl } = await resource.zoneFor(fqdn)
    const current = await resource.current({ domain, subdomain })
    await resource.update({
      domain,
      subdomain,
      records: [...current, token],
      minimumTtl,
    })

    res.sendStatus(201)

    next()
  })
)

app.post(
  '/cleanup',
  ash(async (req, res, next) => {
    const { fqdn } = req.body

    const { domain, subdomain } = await resource.zoneFor(fqdn)

    await resource.delete({ domain, subdomain })

    res.sendStatus(204)

    next()
  })
)

app.use((err, _, res, next) => {
  console.error(err)
  res.sendStatus(500)

  next()
})

app.listen(PORT, HOST, () =>
  console.log(`Server started on ${HOST}:${PORT}...`)
)
