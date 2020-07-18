const puppeteer = require("puppeteer");
const schedule = require("node-schedule");
require("dotenv").config();

const delay = 3000;

async function register(page) {
  await page.waitFor(delay);
  let date = new Date();
  let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];
  let whatIWantThatDay = [
    `//*[@id="classSchedule-mainTable"]/tbody/tr[170]/td[2]/input`, // Sunday at 12:15,
    `//*[@id="classSchedule-mainTable"]/tbody/tr[5]/td[2]/input`, // Monday at 7:15
    `//*[@id="classSchedule-mainTable"]/tbody/tr[34]/td[2]/input`, // Tuesday at 7:15
    `//*[@id="classSchedule-mainTable"]/tbody/tr[62]/td[2]/input`, // Wednesday at 7:15
    `//*[@id="classSchedule-mainTable"]/tbody/tr[93]/td[2]/input`, // Thursday at 7:15
    `//*[@id="classSchedule-mainTable"]/tbody/tr[121]/td[2]/input`, // Friday at 7:15
    `//*[@id="classSchedule-mainTable"]/tbody/tr[157]/td[2]/input`, // Saturday at 12:15,
    `//*[@id="classSchedule-mainTable"]/tbody/tr[170]/td[2]/input`, // Sunday at 12:15,
    `//*[@id="classSchedule-mainTable"]/tbody/tr[5]/td[2]/input`, // Monday at 7:15
  ];
  if (date.getDay() >= 5) {
    try {
      page.click("#week-arrow-r"); //Click to get to the next weeks listings
      await page.waitFor(100); //give it a second to make the change.
    } catch {
      await page.screenshot({ path: "cantFindNextWeek.png" }); //Document the page if it failed
      throw new Error("Enroll Button not found");
    }
  }
  const [button] = await page.$x(`${whatIWantThatDay[date.getDay() + 3]}`); // Register for 2 days in the future
  if (button) {
    await button.click();
  } else {
    await page.screenshot({ path: "cantFind.png" }); //Document the page if it failed
    throw new Error("Signup Button not found");
  }
  await page.waitFor(delay);
  try {
    page.click("#SubmitEnroll2");
  } catch {
    await page.screenshot({ path: "cantFindEnrollButton.png" }); //Document the page if it failed
    throw new Error("Enroll Button not found");
  }
  return;
}

async function login(browser) {
  const page = await browser.newPage();
  await page.goto(process.env.ENDPOINT);
  await page.waitFor(delay);
  await page.type("#su1UserName", `${process.env.USERNAME}`);
  await page.type("#su1Password", `${process.env.PASSWORD}`);
  await page.click("#btnSu1Login");
  await page.waitFor(delay);
  await page.click("#tabA7");
  return page;
}

async function main() {
  let browser;
  try {
    if (process.env.PLATFORM != "rPi") {
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        executablePath: "chromium-browser",
      });
    }
    const page = await login(browser);
    await register(page);
    //Every day at midnight
    let j = schedule.scheduleJob("0 0 * * *", async function () {
      console.log("Time to book swimming!");
      const browser = await puppeteer.launch(chromeOptions);
      const page = await login(browser);
      await register(page);
      page.waitFor(delay);
      await browser.close();
    });
  } catch {
    console.log("Something Errored Out");
    await browser.close();
    schedule.cancelJob();
  }
  //id = SubmitEnroll2;
  //*[@id="classSchedule-mainTable"]/tbody/tr[120]/td[2]/input
  return;
}

main();
