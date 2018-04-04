# ico-scraper-backend

I made the scraper for the **ICOs** using **NodeJS v7.9.0** and **Express ^4.16.3**  and a lightweight small local JSON database **lowdb ^1.0.0**.

In order to run the backend project, the following commands should be executed in the root directory:
* **npm install --save**
* **npm start**

That will install the necessary dependencies and execute : **node index.js**.

The **index.js file is the entry** for the project and currently it is configured to
start both the api, and the background crawl for the cointelegraph.com
scraping.

It can be toggled to start just the **background crawl** or just the **api** *as you
wish*.

### How it works:

* Initially I left the previously scraped data in the **db.json** file and the images
in the **public/images** directory, so if you run the frontend immediately
after the backend is started, you don’t need to wait the initial data to be
scraped.


* The background-crawler is a (cron job) scheduled to run every half an
hour in order to update the latest icos data icocalendar.

* It starts the crawler module that scrapes the data from the list and makes
a separate request for **each ico’s inner page** (*This is the page where we
infer the **fullDescription**, the **token symbol**, the **original website name**
etc.*)

* The crawler saves the scraped data to the database.
* The **frontend** communicates with the **api**.
* The **api** uses the **db-service** module, to retrieve and parse the data from
the database and sends it to the client.
* The **scraper.js** module is responsible for **cheerio** handling, inferring and
processing of the data that needs to be scraped.

* Because I took this line from the requirements very seriously: 
> All data must be served from the back-end (the data scraped), no external
links.

* For each scraped ico, I download an icon image and put it in the */public/images* directory.
So, from a frontend perspective this is the link used to access the
image src (eg: **/adhive.png**).
