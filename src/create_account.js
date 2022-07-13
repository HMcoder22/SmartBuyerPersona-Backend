const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const bcrypt = require('bcryptjs');
const saltRounds = 10;  // salt for hashing
const router = express.Router();
const validator = require('email-validator');
// const sendmail = require('./sendmail');
const SparkPost = require('sparkpost');
const {putData, retrieveData, updateData} = require('./database_tools.js');
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

async function removeVerificationCode(data){
    const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true }); // Create a client end-point

    try{
        await client.connect();
        // Remove authorized code
        const result = await updateData(client, "User", "Login", {username: data.username}, {$unset: {authorized_code: 1}}, false); 
        await client.close();
        return result;
    }
    catch(err){
        console.error(err);
        return undefined;
    }
}

app.post("/login/sign_up", async function(req, res){
    // Email and password field is not filled up
    if(req.body.email === '' || req.body.password === '' || req.body.re_password === ''){
        res.json(JSON.stringify({success: false, error: "Missing field"}));
        return;
    }
    // The two passwords are not matched
    if(req.body.password !== req.body.re_password){
        res.json(JSON.stringify({success: false, error: "Unmatched password"}))
        return;
    }
    // The email is not
    if(!validator.validate(req.body.email)){
        res.json(JSON.stringify({success: false, error: "Invalid email"}))
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
        authorized_code: req.body.authorized_code   // verification code
    };

    var success = false;
    var error = "";
    await addUSer(user).then(res => {success = res.acknowledged; error = res.error});

    if(success){
        // sendmail({
        //     authorized_code: req.body.authorized_code
        // });
        const client = new SparkPost("ef572ec5e2d59ce44fecd2daa40dc0103f587c95");
        client.transmissions.send({
            content: {
              from: 'testg@smartbuyerpersona-product.com',
              subject: 'Hello, World!',
              html:'<html><body><p>Testing SparkPost - the world\'s most awesomest email service!</p></body></html>'
            },
            recipients: [
              {address: '<billtrancon12@gmail.com>'}
            ]
          })
          .then(data => {
            console.log('Woohoo! You just sent your first mailing!');
            console.log(data);
          })
          .catch(err => {
            console.log('Whoops! Something went wrong');
            console.log(err);
          });
    }
    res.json(JSON.stringify({success: success, error: error}));
    
    // Remove the verification after 45 seconds
    setInterval(async () => removeVerificationCode(user), 45* 1000); 
})

// app.use(`/.netlify/functions/create_account`, router);

// module.exports = app;
// module.exports.handler = serverless(app);

app.listen(4000);
