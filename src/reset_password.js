const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const bcrypt = require('bcryptjs');
const saltRounds = 10;  // salt for hashing
const router = express.Router();
const validator = require('validator');
const {updateData, retrieveData} = require('./database_tools');
const {MongoClient} = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json({limit: '50mb'}));


/**
 * 
 * @param {String} email user's email 
 * @returns status of getting user's info
 */
async function getUserLoginInfo(email){
    const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });   // Create a client end-point

    try{
        await client.connect();
        const result = await retrieveData(client, "User", "Login", {username: email}).catch(err => console.log(err));  // Get a user info based on the username
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
 * @param {String} password user's new password
 * @return {Object} status of updating password
 */
async function updatePassword(email, password){
    const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true }); // Create a client end-point

    const salt = await bcrypt.genSalt(saltRounds)
    .catch(err => console.log(err));

    try{
        await client.connect();
        const result = await updateData(client, "User", "Login", {username: email}, {$set: {
            password: await bcrypt.hash(password, salt).catch(err => console.log(err))
        }}, false)
        .catch(err => console.log(err));

        await client.close();
        return JSON.parse(result.body);
    }
    catch(err){
        console.error(err);
        return undefined;
    }
}

router.post('/reset', async function(req, res){
    // Handling errors
    if(req.body.password !== req.body.reenter_password){
        res.json(JSON.stringify({success: false, error: 'Unmatched password'}));
        return;
    }

    const user = await getUserLoginInfo(req.body.email).catch(err => console.log(err));
    if(await bcrypt.compare(req.body.password, user.password)){
        res.json(JSON.stringify({success: false, error: 'Old password'}))
        return;
    }

    if(!validator.isStrongPassword(req.body.password, {
        minLength: 12, 
        minLowercase: 1,
        minUppercase: 1, 
        minNumbers: 1, 
        minSymbols: 1
    })){
        res.json(JSON.stringify({success: false, error: 'Weak password'}));
        return;
    }

    // From this point, it should be success
    const result = await updatePassword(user.username, req.body.password).catch(err => console.log(err));
    if(result === undefined){
        res.json(JSON.stringify({success: false, error: 'update failed'}));
        return;
    }
    res.json(JSON.stringify({success: true, error: ''}));
})

app.use(`/.netlify/functions/reset_password`, router);

module.exports = app;
module.exports.handler = serverless(app);

// app.listen(4004);
