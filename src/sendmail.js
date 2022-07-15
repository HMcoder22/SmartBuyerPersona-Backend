"use strict";
const SparkPost = require('sparkpost');

// async..await is not allowed in global scope, must use a wrapper
module.exports.sendVerificationCode = async function sendVerificationCode(param) {
  const client = new SparkPost(process.env.SPARKPOST);
  await client.transmissions.send({
      content: {
        from: 'no-reply@smartbuyerpersona-product.com',
        subject: 'Code verification for sign-up!',
        html:`<html><body><span>Your verification code is <b>${param.authorized_code}</b>. Your code is expired after 45 seconds.</span></body></html>`
      },
      recipients: [
        {address: `<${param.username}>`}
      ]
    })
    .catch(err => {
      console.log('Whoops! Something went wrong');
      console.log(err);
    });
}
