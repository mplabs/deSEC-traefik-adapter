require('dotenv').config()

const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')

const { ash, getInfix } = require('./libs/util')
const Resource = require('./libs/desec.resource')

const {
  HOST = '127.0.0.1',
  PORT = 1337,
  DEDYN_TOKEN,
  DEDYN_NAME,
  NODE_ENV
} = process.env

if (!(DEDYN_NAME || DEDYN_TOKEN)) {
  throw new Error('Set DEDYN_TOKEN and DEDYN_NAME as environment variables.')
  process.exit(1)
}

const resource = Resource({ domainName: DEDYN_NAME, token: DEDYN_TOKEN })

const app = express()

app.use(bodyParser.json())
app.use(logger(NODE_ENV === 'production' ? 'tiny' : 'dev'))

app.use(ash(async (req, res, next) => {
  req.app.locals.minimumTtl = await resource.minimumTtl()

  next()
}))

// Routes
app.post('/present', ash(async (req, res, next) => {
  const { minimumTtl } = req.app.locals
  const { fqdn, value } = req.body

  const subname = getInfix(DEDYN_NAME, fqdn)
  const token = `\"${value}\"`

  const current = await resource.current(subname)
  await resource.update(subname, [...current, token], minimumTtl)
  
  res.sendStatus(201)

  next()
}))

app.post('/cleanup', ash(async (req, res, next) => {
  const { fqdn } = req.body

  const subname = getInfix(DEDYN_NAME, fqdn)

  await resource.delete(subname)

  res.sendStatus(204)

  next()
}))

app.use((err, req, res, next) => {
  console.error(err)
  res.sendStatus(500)
})

app.listen(PORT, HOST, () => console.log(`Server started on ${HOST}:${PORT}...`))
