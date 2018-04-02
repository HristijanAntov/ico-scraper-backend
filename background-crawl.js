const CronJob = require('cron').CronJob
const winston = require('winston')
const crawler = require('./lib/crawler');
const { Categories } = require('./util/constants')
const config = require('./config')

async function crawlInBackground() {

  /*
    Infinity means all of the given category,
    we could give an actual number instead to provide paging
  */

  await crawler.crawl({ howMuch: Infinity, category: Categories.Ongoing })
  await crawler.crawl({ howMuch: Infinity, category: Categories.Upcoming })
  await crawler.crawl({ howMuch: Infinity, category: Categories.Past })

  winston.info('Crawling back to you')
}



// This is a cron expression to schedule the cron job every half an hour after it is started
const crawlInterval = config.backgroundCrawlInterval

const crawlJob = new CronJob(crawlInterval, function () {
  crawlInBackground()
}, null, false, null, null, false);


function start() {
  crawlJob.start()
  /* 
  The first time we start it manually because for some reason the cron job is not started
  when start is called on the job instance
  */
  crawlInBackground() 

}

module.exports = {
  start,
}