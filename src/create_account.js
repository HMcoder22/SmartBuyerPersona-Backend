const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const bcrypt = require('bcryptjs');
const saltRounds = 10;  // salt for hashing
const router = express.Router();
const validator = require('email-validator');
const {putData, retrieveData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json({limit: '50mb'}));

async function addUSer(data){
    const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try{
        await client.connect();
        // Check if the email already registered in the database
        const user = await retrieveData(client, "User", "Login", {username: data.email});
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
    // Email and password field is not filled up
    if(req.body.email === '' || req.body.password === '' || req.body.re_password === ''){
        res.json(JSON.stringify({success: false, error: "Missing field"}));
        return;
    }
    if(req.body.password !== req.body.re_password){
        res.json(JSON.stringify({success: false, error: "Unmatched password"}))
        return;
    }
    if(!validator.validate(req.body.email)){
        res.json(JSON.stringify({success: false, error: "Invalid email"}))
        return;
    }

    // Hashing password
    const salt = await bcrypt.genSalt(saltRounds);
    const hash_password = await bcrypt.hash(req.body.password, salt);
    
    var user = {
        fname: req.body.fname,
        birthdate: req.body.birthdate,
        username : req.body.email,
        password: hash_password,
        verify: false
    };

    var success = false;
    var error = "";
    await addUSer(user).then(res => {success = res.acknowledged; error = res.error});
    res.json(JSON.stringify({success: success, error: error}));
})



app.use(`/.netlify/functions/create_account`, router);

module.exports = app;
module.exports.handler = serverless(app);

// app.listen(4000);
