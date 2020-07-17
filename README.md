# mindbody_automation
Automated Sign Up for Lap Lane Swim Times

## Quick Start
* Create .env file with the following information

ENDPOINT=https://clients.mindbodyonline.com/ASP/su1.asp?studioid=451945
USERNAME=YOUR_USERNAME_HERE
PASSWORD=YOUR_PASSWORD_HERE

* open terminal, run `npm install`
* `npm start`

At midnight every night it will book the swimming times you want (since the slots become available at midnight).
