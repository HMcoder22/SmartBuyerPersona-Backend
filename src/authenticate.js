const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const router = express.Router();
const bcrypt = require('bcryptjs');
const {retrieveData, updateData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');
const { sendVerificationCode } = require('./sendmail.js');
var new_code = 0;
require('dotenv').config();

app.use(cors());
app.use(express.json({limit: '50mb'}));

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

// Update authorized code for that user
async function updateCode(email){
    // Create a connection point
    const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });   // Create a client end-point
    
    // Generating a new code
    new_code = generateRandomToken();
    const salt = await bcrypt.genSalt(10);
    const new_hash_code = await bcrypt.hash(new_code.toString(), salt);

    try{
        await client.connect();
        const result = await updateData(client, "User", "Login", {username: email}, {$set: {authorized_code: {token: new_hash_code, issued: new Date()}}}, true);  // Get a user info based on the username
        await client.close();
        return {success: true, error: ''};
    }
    catch(err){
        console.error(err);
        return {success: false, error: 'update failed'};
    }
}


router.post("/login/authentication", async function(req, res){
    var password = "";
    var verified = false;
    var access = false;
    await getUserLoginInfo(req.body.email).then(res => {
        if(res !== null){
            password = res.password;
            verified = res.verify;
            access = res.access;
        }
    })
    .catch(err => {
        console.log(err);
    })

    // Comparing entered password and password in the database
    const matched = await bcrypt.compare(req.body.password, password);
    
    // If the password is entered correctly and the account is verified -> success
    if(matched && verified && access){
        res.json(JSON.stringify({result: 'success', error: ''}));
        return;
    }

    // Password not matched
    if(!matched){
        res.json(JSON.stringify({result: 'failed', error: 'Incorrect password'}));
        return;
    }

    // Not verified -> send a new code to verify
    if(!verified){
        // Not verified
        res.json(JSON.stringify({result: 'failed', error: 'Not verified'}));

        // Update a new code
        await updateCode(req.body.email)
        .catch(err => {
            console.log(err);
        })

        // Resend a new code
        await sendVerificationCode({
            authorized_code: new_code,
            username: req.body.email
        })
        return;
    }

    res.json(JSON.stringify({result: 'failed', error: 'Access denied'}));
})

function getRandomNumber(max){
    return Math.floor(Math.random() * max);
}

function generateRandomToken(){
    var token = 0;
    for(let i = 0; i < 9; i++){
        token += getRandomNumber(10);
        token *= 10;
    }
    return token + getRandomNumber(10);
}


app.use(`/.netlify/functions/authenticate`, router);

module.exports = app;
module.exports.handler = serverless(app);

// app.listen(4002);