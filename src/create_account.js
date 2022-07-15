const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const bcrypt = require('bcryptjs');
const saltRounds = 10;  // salt for hashing
const router = express.Router();
// const validator = require('email-validator');
const validator = require('validator');
const {sendVerificationCode} = require('./sendmail');
const {putData, retrieveData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json({limit: '50mb'}));

async function addUSer(data){
    const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true }); // Create a client end-point

    try{
        await client.connect();
        // Check if the email already registered in the database
        const user = await retrieveData(client, "User", "Login", {username: data.username});
        const ret = JSON.parse(user.body);
        // The email is good to use
        if(ret === null){
            const result = await putData(client, "User", "Login", data);
            await client.close();
            return JSON.parse(result.body);
        }

        // The email already in the database
        await client.close();
        return {acknowledged: false, error: "Unavailable email"};
    }
    catch(err){
        console.error(err);
        return undefined;
    }
}

router.post("/login/sign_up", async function(req, res){
    const err = [];
    // Email and password field is not filled up
    if(req.body.email === '' || req.body.password === '' || req.body.re_password === ''){
        // res.json(JSON.stringify({success: false, error: "Missing field"}));
        // return;
        err.push("Missing field");
    }
    // The two passwords are not matched
    if(req.body.password !== req.body.re_password){
        // res.json(JSON.stringify({success: false, error: "Unmatched password"}))
        // return;
        err.push('Unmatched password')
    }
    // The email is not valid
    if(!validator.isEmail(req.body.email)){
        // res.json(JSON.stringify({success: false, error: "Invalid email"}))
        // return;
        err.push('Invalid email')
    }

    if(!validator.isISO8601(req.body.birthdate)){
        // res.json(JSON.stringify({success: false, error: 'Invalid date'}));
        // return;
        err.push('Invalid date');
    }

    // Check if there are any errors occur
    if(err.length !== 0){
        res.json(JSON.stringify({success: false, error: err}));
        return;
    }

    // Hashing password
    const salt = await bcrypt.genSalt(saltRounds);
    const hash_password = await bcrypt.hash(req.body.password, salt);
    
    var user = {
        fname: req.body.fname,  // full name of the user
        birthdate: req.body.birthdate,
        username : req.body.email,
        password: hash_password,
        verify: false,   // indicating that the user still needs to verify
        authorized_code: {
            token: await bcrypt.hash(req.body.authorized_code.toString(), salt),   // verification code
            issued: new Date(),
        }
    };

    var success = false;
    var error = "";
    await addUSer(user).then(res => {success = res.acknowledged; error = res.error});

    if(success){
        sendVerificationCode({
            authorized_code: req.body.authorized_code,
            username: user.username
        });
    }
    res.json(JSON.stringify({success: success, error: error}));
    
})

app.use(`/.netlify/functions/create_account`, router);

module.exports = app;
module.exports.handler = serverless(app);

// app.listen(4000);
