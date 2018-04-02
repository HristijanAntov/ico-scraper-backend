const config = require('../config')

const Categories = {
  Ongoing: 'ongoing',
  Upcoming: 'upcoming',
  Past: 'past',
}

const defaultCrawlOptions = {
  from: 0,
  howMuch: config.pagingSize,
  category: Categories.Ongoing,
};

module.exports = {
  Categories,
  defaultCrawlOptions,
}