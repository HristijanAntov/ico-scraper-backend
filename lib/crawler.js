const request = require('request-promise')
const winston = require('winston')
const databaseService = require('../util/db-service')
const scraper = require('./scraper')
const { defaultCrawlOptions } = require('../util/constants')
const {
  transformResponseBody,
  manageIconDownload,
  sliceIcosInFixedSlots,
  wait,
} = require('../util/helpers')

const config = require('../config.json')

async function crawlInnerPage(ico, retry = 0) {

  let $
  const requestOptions = {
    uri: `${config.baseUrl}${ico.innerPageUrl}`,
    transform: transformResponseBody,
  }

  try {
    $ = await request(requestOptions)
  } catch (error) {
    winston.error(error)

    if (retry < 3) {
        winston.info('Retrying to crawl inner page for -' + ico.id)
        await wait(1000)
        return crawlInnerPage(ico, retry + 1)
    }
    
    databaseService.insertOrUpdateIco(ico)
    return ico
  }

  const fullIco = Object.assign({}, ico, scraper.scrapeInnerPage($))
  const iconLocalUrl = await manageIconDownload(fullIco, databaseService)
  const icoRecord = Object.assign({}, fullIco, { iconLocalUrl })

  databaseService.insertOrUpdateIco(icoRecord)
  return icoRecord
}


async function crawl(options) {

  let $
  const crawlOptions = Object.assign({}, defaultCrawlOptions, options || {})
  const requestOptions = {
    uri: `${config.baseUrl}/ico-calendar`,
    transform: transformResponseBody,
  }

  try {
    $ = await request(requestOptions)
  } catch (error) {
    winston.error(error)
    throw new Error(error)
  }

  const icos = scraper.scrapeIcoList(
    crawlOptions.category,
    crawlOptions.from,
    crawlOptions.from + crawlOptions.howMuch,
    $
  )

  try {
    winston.info(`TOTAL icos from category "${crawlOptions.category}": ${icos.length}`)

    const slicedIcos = sliceIcosInFixedSlots(icos)
    let result = []

    winston.info(`Concurrent slots count: ${slicedIcos.length}`)

    for (let [nth, icosSlot] of slicedIcos.entries()) {

      const scraped = await Promise.all(icosSlot.map(crawlInnerPage))
      result = [...result, ...scraped]

      winston.info(`${nth + 1}-th slot done, ${slicedIcos.length - (nth + 1)} more to go`)

      await wait(config.delayBetweenSlots)
    }

    return result

  } catch (error) {
    winston.error(error)
    throw new Error(error)
  }
}

module.exports = {
  crawl
}