const puppeteer = require('puppeteer');
const m = require('moment');
require('dotenv').config();

const lb_username = process.env.LETTERBOXD_USERNAME;
const lb_password= process.env.LETTERBOXD_PASSWORD;



(async () => {
   const prompt = require("prompt-sync")({ sigint: true });
   const date = prompt("Chose the date to remove (year (YYYY), month (YYYY/MM) or day (YYYY/MM/DD): ");
   console.log(`Removing ${date} \n`);


   const browser = await puppeteer.launch({ headless: false});
   const page = await browser.newPage();
   await page.setViewport({ width: 1620, height: 700 });
   await page.goto('https://letterboxd.com/', { waitUntil: "load" });

   await page.waitForSelector('.fc-cta-consent').catch(() => {
      console.log(".fc-cta-consent")
   });

   await page.evaluateHandle(() => {
      document.querySelector('.fc-cta-consent').click()
   }).catch(() => console.log('Cannot find .fc-cta-consent'))
   
   await page.waitForSelector('.sign-in-menu').catch(() => {
      console.log(".sign-in-menu wait failed")
   });

   await page.evaluateHandle(() => {
      document.querySelector('.sign-in-menu>a').click() 
   }).catch(() => console.log('Cannot find Signup'))

   await page.waitForSelector('#username').catch(() => {
      console.log("#username wait failed")
   });
   await page.waitForSelector('#password').catch(() => {
      console.log("#password wait failed")
   });

   await page.evaluateHandle((lb_username, lb_password) => {
      document.querySelector('#username').value = lb_username
      document.querySelector('#password').value = lb_password 
      document.querySelector('.button.-action.button-green').click()
   }, lb_username, lb_password).catch(() => console.log('Cannot log'))


   await page.waitForSelector('#add-new-button').catch(() => {
      console.log("#add-new-button wait failed")
   });
   await page.goto(`https://letterboxd.com/${lb_username}/films/diary/for/${date}/`, { waitUntil: "load" });

   await page.waitForSelector('.pagination').catch(() => {
      console.log(".pagination wait failed")
   })
   await page.waitForSelector('.paginate-pages>ul>li').catch(() => {
      console.log(".paginate-pages>ul>li wait failed (possibly because there's only 1 page)")
   })

   let number_pages = await page.evaluate(() => {
      const last_page = document.querySelectorAll('.paginate-pages>ul>li').length

      if (last_page == 0 ) {
         return 1
      } else {
         return document.querySelectorAll('.paginate-pages>ul>li')[last_page-1].innerText
      }
   })

   for (let i = 0; i<number_pages; i++) {
      if (i>0) {
         await page.evaluate(() => {
            location.reload(true)
         }).catch(() => console.log('Cannot refresh'))
         await page.waitForSelector('.pagination').catch(() => {
            console.log(".pagination wait failed")
         });

         await page.waitForTimeout(500)
         console.log("\nPage", i+1, '\n')
      }

      let number_items= await page.evaluate(() => {
         return document.querySelectorAll('.diary-entry-edit.shown-for-owner').length
      } )

      if (number_items == 0) {
         console.log("No log on this date")
         page.close()
         browser.close()
      }

      for (let j = 0; j<number_items; j++) {
         console.log("Deleting movie", j+1, 'of page', i+1)

         await page.evaluateHandle((j) => {
            document.querySelectorAll('.diary-entry-edit.shown-for-owner>a')[j].click()
         },j).catch(error => console.log('Cannot click on movie edit', j+1));

         await page.waitForSelector('.specify-date-label-open>i').catch(() => {
            console.log("specify-date-label-open>i wait failed")
         })
         await page.waitForSelector('#diary-entry-submit-button').catch(() => {
            console.log("#diary-entry-submit-button wait failed")
         })

         await page.evaluateHandle(() => {
            document.querySelector('.specify-date-label-open>i').click() 
            document.querySelector('#diary-entry-submit-button').click() 
         }).catch(error => console.log('Cannot edit movie', j+1));


         await page.waitForTimeout(1000)
      }
   }

   process.exit()
}) ()

