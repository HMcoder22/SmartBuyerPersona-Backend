"use strict";
const nodemailer = require("nodemailer");


// async..await is not allowed in global scope, must use a wrapper
module.exports = async function sendmail(param) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "gia@hagosmarketing.com", // generated ethereal user
      pass: "zghwoihpeurxnsio", // generated ethereal password
    },
  });

  // send mail with defined transport object
  await transporter.sendMail({
    from: '"No-reply" <gia@hagosmarketing.com>', // sender address
    to: "billtrancon12@gmail.com", // list of receivers
    subject: "Code verification for sign-up", // Subject line
    text: `Your verification code is ${param.authorized_code}. Your code is expired after 45 seconds`, // plain text body
    html: `<span>Your verification code is <b>${param.authorized_code}</b>. Your code is expired after 45 seconds</span>`, // html body
  });

}