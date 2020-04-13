require('dotenv').config()

const axios = require('axios')
const express = require('express')

const { HOST = '0.0.0.0', PORT = 1337, DEDYN_TOKEN, DEDYN_NAME } = process.env

const app = express()

app.listen(PORT, HOST, () =>
  console.log(`Server started on ${HOST}:${PORT}...`)
)
