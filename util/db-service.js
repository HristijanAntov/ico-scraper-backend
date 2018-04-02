const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const config = require('../config')
const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({ icos: [] }).write()

const stripIco = ({
  id,
  name,
  startDate,
  endDate,
  iconLocalUrl,
  website,
  shortDescription,
  fullDescription,
  tokenSymbol,
  category,
}) => ({
    id,
    name,
    startDate,
    endDate,
    iconLocalUrl,
    website,
    shortDescription,
    fullDescription,
    tokenSymbol,
    category,
  })

function insertOrUpdateIco(ico) {
  const striped = stripIco(ico)
  const record = db
    .get('icos')
    .find({ id: ico.id })
    .value()

  if (record === undefined) {
    db.get('icos')
      .push(striped)
      .write()
  } else {
    db.get('icos')
      .find({ id: ico.id })
      .assign(striped)
      .write()
  }
}

function isThereIconLocalUrl(id) {
  const record = db.get('icos')
    .find({ id })
    .value()

  return (
    record !== undefined &&
    record.iconLocalUrl !== undefined &&
    record.iconLocalUrl !== config.placeholderIconUrl
  )
}

function getIcoById(id) {
  return db.get('icos')
    .find({ id })
    .value()
}

function getIcosByCategory(category) {
  return db.get('icos')
    .filter({ category })
    .value()
}

function getIcos() {
  return db.get('icos').value()
}

module.exports = {
  insertOrUpdateIco,
  isThereIconLocalUrl,
  getIcoById,
  getIcosByCategory,
  getIcos,
}