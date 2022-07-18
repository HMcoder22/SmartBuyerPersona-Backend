const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const bcrypt = require('bcryptjs');
const validator = require('validator');
const router = express.Router();
const {sendVerificationCode, sendNewUserNotification} = require('./sendmail')
const {retrieveData, updateData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');
const { sendPhoneVerification } = require('./send_code_phone');
var new_email_code = 0;
var new_phone_code = 0;

require('dotenv').config();

app.use(cors());
app.use(express.json({limit: '50mb'}));

// Get user login info for authorized code
async function getUserLoginInfo(email){
    const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });   // Create a client end-point

    try{
        await client.connect();
        const result = await retrieveData(client, "User", "Login", {username: email});  // Get a user info based on the username
        await client.close();
        return JSON.parse(result.body);
    }
    catch(err){
        console.error(err);
        return undefined;
    }
}

/**
 * 
 * @param {String} email user's email 
 * @param {Boolean} updateEmail flag for updating email authorization code
 * @param {Boolean} updatePhone flag for updating phone authorization code
 * @returns {Object} status of update
 */
async function updateCode(email, updateEmail, updatePhone){
    // Create a connection point
    const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });   // Create a client end-point
    
    // Generating a new code
    if(updateEmail) new_email_code = generateRandomToken(10);
    if(updatePhone) new_phone_code = generateRandomToken(4);
    const salt = await bcrypt.genSalt(10);


    try{
        await client.connect();
        
        if(updateEmail){
            await updateData(client, "User", "Login", {username: email}, {$set: {
                email_authorized_code: {
                    token: await bcrypt.hash(new_email_code.toString(), salt).catch(err => console.log(err)), 
                    issued: new Date()
                }}}, false)
            .catch(err => console.log(err));
        }

        if(updatePhone){
            await updateData(client, "User", "Login", {username: email}, {$set: {
                phone_authorized_code: {
                    token: await bcrypt.hash(new_phone_code.toString(), salt).catch(err => console.log(err)), 
                    issued: new Date()
                }}}, false)
            .catch(err => console.log(err));
        }
        
        await client.close();
        return {success: true, error: ''};
    }
    catch(err){
        console.error(err);
        return {success: false, error: 'update failed'};
    }
}

// The account is verified
async function isVerified(email){
    // Create a connection point
    const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });   // Create a client end-point

    try{
        await client.connect();
        await updateData(client, "User", "Login", {username: email}, {$set: {verify: true}, $unset: {email_authorized_code: 1, phone_authorized_code: 1}}, true);  // Get a user info based on the username
        await client.close();
        return {success: true, error: ''};
    }
    catch(err){
        console.error(err);
        return {success: false, error: 'update failed'};
    }
}

// Verifying authorization code
router.post('/login/code_verify', async function(req, res){
    const user = await getUserLoginInfo(req.body.username).catch(err => console.log(err));
    const matched = await bcrypt.compare(req.body.email_verified_code.toString(), user.email_authorized_code.token).catch(err => console.log(err));
    const currentTime = new Date();
    const issuedTime = new Date(user.email_authorized_code.issued);
    
    if(matched && currentTime - issuedTime <= 15 * 60 * 1000){        
        await isVerified(req.body.username)
        .catch(err => {
            console.log(err)
        });
        
        await sendNewUserNotification({
            email: user.username,
            fname: user.fname,  // User full name
            bname: user.bname,  // User business name
            phone: user.phone,   // User phone number,
            job: user.job
        })
        .catch(err => {
            console.log(err);
        })

        res.json(JSON.stringify({success: true, error: ''}));
        return;
    }
    
    // List of all errors
    const err = [];
    if(!email_matched){
        err.push("Unmatched email code");
    }

    if(email_matched && currentTime - email_issuedTime > 15 * 60 * 1000){
        err.push('Email code expired');
    }

    res.json(JSON.stringify({success: false, error: err}))
})

// Resend authorization code
router.post('/login/code_verify/resend_code', async function(req, res){
    const user = await getUserLoginInfo(req.body.username).catch(err => console.log(err));

    //Update the authentication code
    await updateCode(req.body.username, true, true)
    .catch(err =>{
        console.log(err);
        res.json(JSON.stringify({success: false, error: 'updating failed'}))
    });

    // Resend the new phone code
    await sendPhoneVerification({
        authorized_code: new_phone_code,
        phone: user.phone
    })
    .catch(err => {
        console.log(err);
    })
    
    // Resend the new email code
    await sendVerificationCode({
        authorized_code: new_email_code,
        username: req.body.username
    }, "Code verification for sign-up!")
    .catch(err => {
        console.log(err);
        res.json(JSON.stringify({success: false, error: 'sending failed'}))
    })

    // Successfully send
    res.json(JSON.stringify({success: true, error: ''}));

})


// Forgot password
router.post('/forgot_password/send_code', async function(req, res){
    // Invalid email format
    if(!validator.isEmail(req.body.email)){
        res.json(JSON.stringify({success: false, error: 'Invalid email'}));
        return;
    }
    
    const user = await getUserLoginInfo(req.body.email).catch(err => console.log(err));
    // User not found
    if(user === null){
        res.json(JSON.stringify({success: false, error: "Email not found!"}));
        return;
    }
    
    // Updating the email authorization code
    await updateCode(req.body.email, true, false)
    .catch(err => console.log(err));

    // Resend the new email code
    await sendVerificationCode({
        authorized_code: new_email_code,
        username: req.body.email
    }, "Your email code verificaiton is here!")
    .catch(err => {
        console.log(err);
        res.json(JSON.stringify({success: false, error: 'sending failed'}))
    })

    // Successfully send
    res.json(JSON.stringify({success: true, error: ''}));

})

// Verifying authorization code
router.post('/forgot_password/email_verify', async function(req, res){
    const user = await getUserLoginInfo(req.body.email).catch(err => console.log(err));
    const matched = await bcrypt.compare(req.body.email_verified_code.toString(), user.email_authorized_code.token).catch(err => console.log(err));
    const currentTime = new Date();
    const issuedTime = new Date(user.email_authorized_code.issued);
    
    // Matched authorization code and within 15 minutes
    if(matched && currentTime - issuedTime <= 15 * 60 * 1000){        
        res.json(JSON.stringify({success: true, error: ''}));
        return;
    }
    
    // List of errors
    if(!matched){
        res.json(JSON.stringify({success: false, error: 'Unmatched email code'}))
        return;
    }

    res.json(JSON.stringify({success: false, error: 'Email code expired'}));
})

// Resend authorization code
router.post('/forgot_password/email_verify/resend_code', async function(req, res){
    const user = await getUserLoginInfo(req.body.email).catch(err => console.log(err));

    //Update the authentication code
    await updateCode(req.body.email, true, false)
    .catch(err =>{
        console.log(err);
        res.json(JSON.stringify({success: false, error: 'updating failed'}))
    });
    
    // Resend the new email code
    await sendVerificationCode({
        authorized_code: new_email_code,
        username: req.body.email
    }, "Your email code verificaiton is here!")
    .catch(err => {
        console.log(err);
        res.json(JSON.stringify({success: false, error: 'sending failed'}))
    })

    // Successfully send
    res.json(JSON.stringify({success: true, error: ''}));
})


function getRandomNumber(max){
    return Math.floor(Math.random() * max);
}

function generateRandomToken(max_length){
    var token = 0;
    for(let i = 1; i <= max_length; i++){
        token += getRandomNumber(10);
        token *= 10;
    }
    return token + getRandomNumber(10);
}

app.use(`/.netlify/functions/code_verify`, router);

module.exports = app;
module.exports.handler = serverless(app);

// app.listen(4000);