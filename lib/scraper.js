const winston = require('winston')
const srcset = require('srcset')
const { getIdFromIcoName, processField } = require('../util/helpers')
const { Categories } = require('../util/constants')

function scrapeIcoList(category, from, to, $) {

  winston.info(`Scraping ${category} icos`)

  const selectors = {
    itemLink: 'div.table-companies__item-box a.j-link',
    itemImage: 'img.j-img',
    itemName: 'h2.j-title',
    startDate: 'div.j-start-date div.table-companies__item-date',
    endDate: 'div.j-end-date div.table-companies__item-date',
    shortDescription: 'div.j-anounce p',
    icoItems: {
      [Categories.Ongoing]: '#ico-ongoing .table-companies__box .table-companies__item.j-item',
      [Categories.Upcoming]: '#ico-upcoming .table-companies__box .table-companies__item.j-item',
      [Categories.Past]: '#ico-past .table-companies__box .table-companies__item.j-item',
    },

  }


  const icos = $(selectors.icoItems[category])
    .slice(from, to)
    .map((i, element) => {
      const itemLink = $(element).find(selectors.itemLink)
      const [itemImage, itemName, startDate, endDate, shortDescription] = [
        selectors.itemImage,
        selectors.itemName,
        selectors.startDate,
        selectors.endDate,
        selectors.shortDescription,
      ].map(selector => itemLink.find(selector))

      const preprocessed = {
        iconImageUrl: itemImage.attr('src') !== undefined
          ? itemImage.attr('src')
          : (srcset.parse(itemImage.attr('srcset')).find(o => o.density === 1) || {}).url
      }

      return {
        id: getIdFromIcoName(itemName.text()),
        name: itemName.text(),
        iconImageUrl: preprocessed.iconImageUrl,
        startDate: startDate.text(),
        endDate: endDate.text(),
        shortDescription: shortDescription.text(),
        innerPageUrl: itemLink.attr('href'),
        category,
      }
    })
    .get()

  return icos
}

function scrapeInnerPage($) {

  winston.info('Scraping ico inner page')

  const selectors = {
    icoCard: '.ico-card',
    websiteLink: '.ico-card-about__right .ico-card-about__links .ico-card-about__links-item:nth-child(1) a',
    tabsContainer: '.ico-card-tabs',
    fullDescripton: '#ico-description p, #ico-description ul',
    tokenSymbolContainers: '#ico-detail .detail .description'
  }

  const icoCard = $(selectors.icoCard)
  const [websiteLink] = [
    selectors.websiteLink,
  ].map(selector => icoCard.find(selector))

  const tabsContainer = $(selectors.tabsContainer)
  const [fullDescription, tokenSymbol] = [
    selectors.fullDescripton,
    selectors.tokenSymbolContainers,
  ].map(selector => tabsContainer.find(selector))

  const preprocessed = {
    fullDescription: fullDescription.map((i, element) => $(element).text()).get(),
    tokenSymbol: tokenSymbol.map((i, element) => $(element).text().trim()).get(),
  }

  return {
    website: processField('website', websiteLink.attr('href')),
    fullDescription: processField('fullDescription', preprocessed.fullDescription),
    tokenSymbol: processField('tokenSymbol', preprocessed.tokenSymbol),
  }
}

module.exports = {
  scrapeIcoList,
  scrapeInnerPage,
}
