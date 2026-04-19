const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1491, height: 836 });
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });

  const metrics = await page.evaluate(() => {
    return {
      body: document.body.getBoundingClientRect().width,
      rootFlex: document.querySelector('.min-h-screen').getBoundingClientRect().width,
      sidebar: document.querySelector('.flex-shrink-0').getBoundingClientRect().width,
      mainWrapper: document.querySelector('.flex-1.flex-col').getBoundingClientRect().width,
      nav: document.querySelector('header').getBoundingClientRect().width,
      main: document.querySelector('main').getBoundingClientRect().width,
      firstDivInMain: document.querySelector('main > div').getBoundingClientRect().width
    };
  });

  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
})();
