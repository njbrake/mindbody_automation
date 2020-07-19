const puppeteer = require("puppeteer");
const schedule = require("node-schedule");
const mailgun = require("mailgun-js");
require("dotenv").config();

// how long to wait between each action so page can load
const delay = 3000;
// Should this be on a evening timer or are you running it by default?
const manualRun = false;

async function email(message) {
  const DOMAIN = "sandbox123d47fcdcf2427b91065072f46d6d79.mailgun.org";
  const mg = mailgun({
    apiKey: process.env.MAILGUN_KEY,
    domain: DOMAIN,
  });
  const data = {
    from: process.env.MAILGUN_ENDPOINT,
    to: process.env.EMAIL,
    subject: message,
    text: message,
  };
  mg.messages().send(data, function (error, body) {
    console.log(body);
  });
}

async function register(page) {
  await page.waitFor(delay);
  let date = new Date();
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
  if (date.getDay() >= 5 || date.getDay() === 0) {
    try {
      await page.click("#week-arrow-r"); //Click to get to the next weeks listings
      await page.waitFor(100); //give it a second to make the change.
    } catch {
      await page.screenshot({ path: "cantFindNextWeek.png" }); //Document the page if it failed
      await email("next week button not found");
      throw new Error("next week Button not found");
    }
  }
  await page.waitFor(delay);
  const [button] = await page.$x(`${whatIWantThatDay[date.getDay() + 3]}`); // Register for 2 days in the future
  if (button) {
    await button.click();
  } else {
    await page.screenshot({ path: "cantFind.png" }); //Document the page if it failed
    await email("signup not found");
    throw new Error("Signup Button not found");
  }
  await page.waitFor(delay);
  try {
    await page.click("#SubmitEnroll2");
  } catch {
    await page.screenshot({ path: "cantFindEnrollButton.png" }); //Document the page if it failed
    await email("enroll button not found");
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
  if (process.env.PLATFORM !== "rPi") {
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
  if (manualRun) {
    console.log("Time to book swimming!");
    const page = await login(browser);
    await register(page);
    page.waitFor(delay);
    console.log("done");
    //await browser.close();
    let job = schedule.scheduledJobs["swimming"];
    console.log("done");
    console.log(job.nextInvocation());
  } else {
    try {
      //Every day at midnight
      let j = schedule.scheduleJob("swimming", "0 0 * * *", async function () {
        console.log("Time to book swimming!");
        await email("Time to book swimming!");
        const page = await login(browser);
        await register(page);
        page.waitFor(delay);
        //await browser.close();
        let job = schedule.scheduledJobs["swimming"];
        console.log(job.nextInvocation());
      });
    } catch {
      console.log("Something Errored Out");
      await browser.close();
      schedule.cancelJob();
    }
  }
  return;
}

main();
