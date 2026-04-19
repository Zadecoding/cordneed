const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1475, height: 741 });
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });

  const metrics = await page.evaluate(() => {
    function getDetails(el) {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        class: el.className.split(' ').slice(0,3).join(' ') + '...',
        x: rect.x.toFixed(1),
        y: rect.y.toFixed(1),
        width: rect.width.toFixed(1),
        height: rect.height.toFixed(1),
        display: style.display,
        flex: style.flex,
      };
    }
    
    return {
      body: getDetails(document.body),
      rootFlex: getDetails(document.querySelector('.min-h-screen')),
      sidebarWrapper: getDetails(document.querySelector('.flex-shrink-0')),
      sidebar: getDetails(document.querySelector('aside')),
      mainWrapper: getDetails(document.querySelector('main').parentElement),
      navbar: getDetails(document.querySelector('header')),
      main: getDetails(document.querySelector('main')),
      dashboardContainer: getDetails(document.querySelector('main > div')),
      statsGrid: getDetails(document.querySelector('main > div > div.grid')),
      firstStatCard: getDetails(document.querySelector('main > div > div.grid > div')),
    };
  });

  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
})();
