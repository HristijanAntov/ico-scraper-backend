const cheerio = require('cheerio')
const download = require('image-downloader')
const fakeUserAgent = require('fake-useragent')
const path = require('path')
const slugify = require('slugify')
const winston = require('winston')
const config = require('../config')
const fs = require('fs')
const { Categories } = require('./constants')

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const times = n => Array.from(new Array(n), (_, i) => i)


/*
  sliceIcosInFixedSlots function transforms the icos list
  to a fixed size === @config.slotSize slots arrays.
  This is done in order to make a fixed number of concurrent request with Promise.all (in the crawler.js module).
  It must be done in order to not let cointelegrapgh.com return 503 Service Unavailable
  Because some of the categories eg: past icos, is quite long so if we make 300 requests concurrently the server starts rejecting.
*/

const sliceIcosInFixedSlots = icos =>
  icos.reduce((slices, ico, i) =>
    slices.map((slice, j) =>
      Math.floor(i / config.slotSize) === j
        ? [...slice, ico]
        : slice
    )
    , times(Math.ceil(icos.length / config.slotSize)).map(() => []))



function transformResponseBody(body) {
  return cheerio.load(body)
}

function getIdFromIcoName(name) {
  return slugify(name, { lower: true, remove: /[$*_+~.()'"!\-:@]/g })
}

/*
  The downloadIconImage function retries 
  up to @config.maxRetries times between @config.retryDelay time intervals.
  Because sometimes I have issues returning 503 Service Unavailable from cointelgraph.com.
  
  The async function is done in recursive fashion and in the end it always
  returns a result object { ok: boolean, url: string } to the scraper.
  
  The url string will be either the public api url for the original image from cointelgraph.com
    OR
  the public api url for the placeholder ico image. 
*/
async function downloadIconImage(url, name, retry = 0) {

  const options = {
    url: url.startsWith('//') ? `https:${url}` : url,
    dest: path.resolve('public', config.imagesDirectory, name),
    headers: {
      'User-Agent': fakeUserAgent(),
    }
  }

  try {

    await download.image(options)
    const url = `/images/${name}`

    winston.info(`DOWNLOADED: ${name} image.`)

    return { ok: true, url }

  } catch (err) {

    winston.error(`Couldn't download the image with url: ${options.url}`)

    await wait(config.retryDelay)

    if (retry > config.maxRetries) {
      return { ok: false, url: config.placeholderIconUrl }
    }

    winston.info(`Retrying to download the image ${name} for ${retry + 1}-th time`)
    return await downloadIconImage(url, name, retry + 1)
  }
}

async function manageIconDownload(fullIco, db) {
  let iconLocalUrl
  const name = `${fullIco.id}.png`

  // If there isn't an icon yet or the icon is just the placeholder ico icon, try to download it again
  if (!db.isThereIconLocalUrl(fullIco.id)) {
    iconLocalUrl = (
      await downloadIconImage(fullIco.iconImageUrl, name)
    ).url
  }

  return iconLocalUrl || `/images/${name}`
}

function processField(fieldName, value) {
  switch (fieldName) {
    case 'name':
      return value.trim()
    case 'startDate':
      return value.trim()
    case 'endDate':
      return value.trim()
    case 'iconLocalUrl':
      return value.trim()
    case 'website':
      return value.trim()
    case 'shortDescription':
      return value.trim()
    case 'fullDescription':
      return value.map(p => p.trim()).filter(p => p !== '')
    case 'tokenSymbol':
      // Value would be an array here

      if (value.length === 0) {
        return ''
      }

      // This tries to infer the token symbol from a format like eg: "250,000,000 VIOLA"
      const firstParoleWords = value[0].split(' ')
      const lastWord = firstParoleWords[firstParoleWords.length - 1]

      // All letters in the token symbol should be uppercase
      if (lastWord.toUpperCase() === lastWord && firstParoleWords.length === 2) {
        return lastWord
      }

      return ''
  }
}

function validateIcoRequest(request) {

  if (!Object.values(Categories).some(category => category === request.params.category)) {
    return { ok: false, error: `Invalid category parameter: ${request.params.category} provided` }
  }

  return { ok: true }
}

const groupIcosCount = icos => icos.reduce((group, ico) =>
  Object.assign({}, group, {
    [ico.category]: group[ico.category] + 1
  }), {
    ongoing: 0,
    upcoming: 0,
    past: 0,
    total: icos.length,
  })


const stripIcoResponse = ico => ({
  id: ico.id,
  name: ico.name,
  iconUrl: ico.iconLocalUrl,
  shortDescription: ico.shortDescription,
  startDate: ico.startDate,
  endDate: ico.endDate,
  tokenSymbol: ico.tokenSymbol,
  website: ico.website,
  category: ico.category,
})



module.exports = {
  transformResponseBody,
  getIdFromIcoName,
  processField,
  stripIcoResponse,
  validateIcoRequest,
  manageIconDownload,
  sliceIcosInFixedSlots,
  groupIcosCount,
  wait,
}
