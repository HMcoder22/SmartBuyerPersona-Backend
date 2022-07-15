const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const bcrypt = require('bcryptjs');
const router = express.Router();
const {sendVerificationCode} = require('./sendmail')
const {retrieveData, updateData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');
var new_code = 0;

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

router.post('/login/code_verify', async function(req, res){
    const user = await getUserLoginInfo(req.body.username);
    const matched = await bcrypt.compare(req.body.verified_code.toString(), user.authorized_code.token);
    const currentTime = new Date();
    const issuedTime = new Date(user.authorized_code.issued);
    if(matched && currentTime - issuedTime <= 45000){
        res.json(JSON.stringify({success: true, error: ''}));
        return;
    }
    
    if(!matched){
        res.json(JSON.stringify({success: false, error: 'Incorrect code'}))
        return;
    }
    
    res.json(JSON.stringify({success: false, error: 'Expired code'}));
})

router.post('/login/code_verify/resend_code', async function(req, res){
    //Update the authentication code
    await updateCode(req.body.username)
    .catch(err =>{
        console.log(err);
        res.json(JSON.stringify({success: false, error: 'updating failed'}))
    });
    
    // Resend the new code
    await sendVerificationCode({
        authorized_code: new_code,
        username: req.body.username
    })
    .catch(err => {
        console.log(err);
        res.json(JSON.stringify({success: false, error: 'sending failed'}))
    })
    res.json(JSON.stringify({success: true}))
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
    return token;
}

app.use(`/.netlify/functions/code_verify`, router);

module.exports = app;
module.exports.handler = serverless(app);



// app.listen(4001);