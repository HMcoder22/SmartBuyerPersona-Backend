const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const router = express.Router();
const bcrypt = require('bcryptjs');
const {retrieveData, updateData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');
const { sendVerificationCode } = require('./sendmail.js');
const { sendPhoneVerification } = require('./send_code_phone.js');
var new_email_code = 0;
var new_phone_code = 0;
require('dotenv').config();

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

async function getUserLoginInfo(email){
    const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
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
    const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
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


router.post("/login/authentication", async function(req, res){

    const user = await getUserLoginInfo(req.body.email)
    .catch(err => {
        console.log(err);
    });

    // Comparing entered password and password in the database
    const matched = await bcrypt.compare(req.body.password, user.password).catch(err => console.log(err));
    
    // If the password is entered correctly and the account is verified -> success
    if(matched && user.verify && user.access){
        res.json(JSON.stringify({result: 'success', admin: user.admin, error: ''}));
        return;
    }

    // Password not matched
    if(!matched){
        res.json(JSON.stringify({result: 'failed', error: 'Incorrect password'}));
        return;
    }

    // Not verified -> send a new code to verify
    if(!user.verify){
        // Update a new code
        await updateCode(req.body.email, true, false)
        .catch(err => {
            console.log(err);
        })

        // Resend a new email code
        await sendVerificationCode({
            authorized_code: new_email_code,
            username: user.username
        }, "Code verification for sign-up!")
        .catch(err =>{
            console.log(err);
        })

        // Not verified
        res.json(JSON.stringify({result: 'failed', error: 'Not verified'}));
        return;
    }

    res.json(JSON.stringify({result: 'failed', error: 'Access denied'}));
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


//app.use(`/.netlify/functions/authenticate`, router);

module.exports = router;