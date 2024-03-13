import fetch from 'node-fetch';
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

async function run(productUrl){
  let inStock = false;
  while (!inStock){
      inStock = await productInStock(productUrl);
      if (inStock){
          console.log("Product is in stock!");
      }
      else{
          console.log("Product is NOT in stock.");
          await new Promise(resolve => setTimeout(resolve, 5000));
      }
  }
  let productPage = await launchProductPage(productUrl);
  await addViaBrowser(productPage);
  await checkoutProduct(productPage);
}

async function addViaBrowser(page){
  await page.waitForTimeout(1000);
  await page.waitForSelector("button[name='add']");

  await page.evaluate(() => {
    document.querySelector("button[name='add']").click();
  });

  await page.waitForTimeout(7000);
  await page.waitForSelector("button[name='checkout']");
  await page.evaluate(() => {
    document.querySelector("button[name='checkout']").click();
  });

}

async function productInStock(link){
  let response = await fetch(link.split("?")[0] + ".js", {
      "headers": null,
      "body": null,
      "method": "GET"
    }).then(response => {
        if (!response.ok) {
          throw new Error("HTTP error! Status: ${response.status}");
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        } else {
          return response.text();
        }
      })
      .catch(error => {
        console.error("Error: ", error);
      });

  try {
      const parsedResponse = JSON.parse(response);
      if (parsedResponse.hasOwnProperty("available")) {
        return Boolean(parsedResponse.available);
      } else {
        console.error("The 'available' field was not found.");
        return false;
      }
    } catch (error) {
      console.error("Error parsing response: ", error.message);
      return false;
    }
}

async function launchProductPage(link){
  const launchPuppeteer = await puppeteer.launch({headless: false});
  const productPage = await launchPuppeteer.newPage();
  try {
      await productPage.goto(link);
  }
  catch (error) {
      console.error("The initial launch of the page was unsuccessful: ", error);
  }
  return productPage;
}


async function checkoutProduct(page){
  page.waitForTimeout(2000);
  await page.waitForSelector("input[name='email']");
  await page.type("input[name='email']", "xrverma16@gmail.com");
  await page.type("input[name='firstName']", "Ritesh");
  await page.type("input[name='lastName']", "Verma");
  await page.type("input[name='address1']", "6241 Gilston Park Road");
  await page.type("input[name='city']", "Catonsville");
  await page.type("input[name='postalCode']", "21228");
  await page.select("select[name='countryCode']", "United States");
  await page.type("input[name='phone']", "4437645725");
  await page.select("select[name='zone']", "MD");
  const continueToShipping = await page.waitForSelector("button[type='submit']");
  await continueToShipping.click();
  
  await page.waitForTimeout(1000);
  const continueToShipping2 = await page.waitForSelector("button[type='submit']");
  await continueToShipping2.click();
  
  await page.waitForTimeout(3000);
  const continueToPayment = await page.waitForSelector("button[type='submit']");
  await continueToPayment.click();

  await enterPaymentDetails(page);
}

async function enterPaymentDetails(page){
  await page.waitForTimeout(4000);
  await page.waitForSelector("iframe[title='Field container for: Card number']");
  let iframeCard = await page.$("iframe[title='Field container for: Card number']");
  let iframeCardContent = await iframeCard.contentFrame();
  await iframeCardContent.type("input[id='number']", "4246315382707911");

  let iframeName = await page.$("iframe[title='Field container for: Name on card']");
  let iframeNameContent = await iframeName.contentFrame();
  await iframeNameContent.type("input[id='name']", "Ritesh Verma");

  let iframeExpiration = await page.$("iframe[title='Field container for: Expiration date (MM / YY)']");
  let iframeExpirationContent = await iframeExpiration.contentFrame();
  await iframeExpirationContent.type("input[id='expiry']", "10 / 25");

  let iframeCode = await page.$("iframe[title='Field container for: Security code']");
  let iframeCodeContent = await iframeCode.contentFrame();
  await iframeCodeContent.type("input[id='verification_value']", "211");

  const continueToPayment = await page.waitForSelector("button[type='submit']");
  await continueToPayment.click();
  console.log("Order was placed!");
  page.waitForTimeout(10000);

}

const productUrlsToCheck = [
  "https://www.stanley1913.com/products/clean-slate-quencher-h20-flowstate-tumbler-30-oz-soft-rain",
];

const runPromises = productUrlsToCheck.map(productUrl => run(productUrl));

Promise.all(runPromises)
  .then(() => {
    console.log("All instances completed successfully.");
  })
  .catch(error => {
    console.error("An error occurred:", error);
  });


