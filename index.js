const api = require('./api')
const backgroundCrawlJob = require('./background-crawl')


/* 

  This is the entry point of the app
  Its job is to start the corresponding services toggled to 'on'
  in our case both the api and the background crawl are started
  but by providing 'false' to the arguments below we can turn it (eg: the api) off
*/
function main(toggler) {

  if (toggler.apiOn) {
    api.start()
  }

  if (toggler.backgroundCrawlOn) {
    backgroundCrawlJob.start()
  }

}

main({
  apiOn: true,
  backgroundCrawlOn: true,
})
