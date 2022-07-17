require('dotenv').config();

// Twilio Credentials
// To set up environmental variables, see http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_TOKEN;

// require the Twilio module and create a REST client
const client = require('twilio')(accountSid, authToken);

module.exports.sendPhoneVerification = async function sendPhoneVerification(param){
  client.messages
    .create({
      to: `${param.phone}`,
      from: '+19705489515',
      body: `Your phone verification is ${param.authorized_code}`,
    })
    .catch(err => console.log(err));
  }