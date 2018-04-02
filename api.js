const express = require('express')
const winston = require('winston')
const cors = require('cors')
const databaseService = require('./util/db-service')
const config = require('./config')
const { Categories } = require('./util/constants')
const { stripIcoResponse, validateIcoRequest, groupIcosCount } = require('./util/helpers')

const app = express()
app.use(express.static('public'))
app.use(cors())

app.get('/icos', (req, res) => {
  const result = databaseService.getIcos()
  res.send(result)
})

app.get('/stats', (req, res) => {
  const icos = databaseService.getIcos()
  const result = groupIcosCount(icos)

  res.send(result)
})

app.get('/icos/:category', async (req, res) => {

  winston.info(`${req.method}: /icos/${req.params.category}`)

  const validationResult = validateIcoRequest(req)

  if (!validationResult.ok) {
    
    winston.error(`Request validation failed: ${validationResult.error}`)
    
    res.status(400).send(validationResult.error)
    return;
  }

  try {
    const result = databaseService.getIcosByCategory(req.params.category)
    res.send(result.map(stripIcoResponse))

  } catch (err) {
    res.status(500).send(err)
  }

})

/*
  The full description is lazily fetched from the frontend eg: (when user clicks on some info icon)
  in order to not send all full description for each ico at once
*/
app.get('/icos/:id/description', (req, res) => {

  winston.info(`${req.method}: /icos/${req.params.id}/description`)

  const ico = databaseService.getIcoById(req.params.id)

  if (ico !== undefined) {
    res.send({ fullDescription: ico.fullDescription })
  } else {
    res.status(404).send(`ICO with id: ${req.params.id} does not exist`)
  }

})

function start() {
  app.listen(config.port, () => console.log(`Server running on ${config.port} port!`))
}

module.exports = {
  start,
}