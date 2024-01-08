const puppeteer = require('puppeteer');
const m = require('moment');
require('dotenv').config();

const lb_username = process.env.LETTERBOXD_USERNAME;
const lb_password= process.env.LETTERBOXD_PASSWORD;



(async () => {
   const browser = await puppeteer.launch({ headless: false });
   const page = await browser.newPage();
   await page.setViewport({ width: 1620, height: 700 });
   await page.goto('https://letterboxd.com/', { waitUntil: "load" });

   await page.waitForSelector('.fc-cta-consent');

   await page.evaluateHandle(() => {
      document.querySelector('.fc-cta-consent').click()
   }).catch(() => console.log('Cannot find .fc-cta-consent'))
   
   await page.waitForSelector('.sign-in-menu');

   await page.evaluateHandle(() => {
      document.querySelector('.sign-in-menu>a').click() 
   }).catch(() => console.log('Cannot find Signup'))

   await page.waitForSelector('#username');
   await page.waitForSelector('#password');

   await page.evaluateHandle((lb_username, lb_password) => {
      document.querySelector('#username').value = lb_username
      document.querySelector('#password').value = lb_password 
      document.querySelector('.button.-action.button-green').click()
   }, lb_username, lb_password).catch(() => console.log('Cannot log'))


   await page.waitForSelector('#add-new-button');
   await page.goto(`https://letterboxd.com/${lb_username}/films/diary/for/2022/12/28/`, { waitUntil: "load" });

   await page.waitForSelector('.paginate-pages');
   let number_pages =0 
   await page.evaluateHandle((number_pages) => {
      const last_page = document.querySelectorAll('.next').length
      number_pages = parseFloat(document.querySelectorAll('.paginate-pages>ul>li')[last_page-1].innerText)
   }, number_pages)

   await page.waitForTimeout(500);
   console.log(number_pages)

   for (let i = 0; i<number_pages; i++) {
      if (i>0) {
         await page.evaluateHandle(() => {
            document.querySelector('.next').click()
         }).catch(() => console.log('Cannot click next'))
         await page.waitForSelector('.paginate-pages');
      }
   }

   // let next = null
   // do {
   //    await page.evaluateHandle(() => {
   //       document.querySelector('.pagination>div.paginate-nextprev>a.next').click()
   //    })

   //    await page.waitForSelector('.paginate-pages');
   //    next = await page.evaluateHandle((next) => {
   //       return document.querySelector('.paginate-disabled>span.next')
   //    }, next)

   //    console.log(next)

   // } while ( next == 1 )
}) ()

