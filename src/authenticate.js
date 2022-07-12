const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const router = express.Router();
const bcrypt = require('bcryptjs');
const {retrieveData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json({limit: '50mb'}));

async function getUserLoginInfo(email){
    const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try{
        await client.connect();
        const result = await retrieveData(client, "User", "Login", {username: email});
        await client.close();
        return JSON.parse(result.body);
    }
    catch(err){
        console.error(err);
        return undefined;
    }
}

router.post("/login/authentication", async function(req, res){
    var password = "";
    await getUserLoginInfo(req.body.email).then(res => {
        password = res.password;
    })
    .catch(err => {
        console.log(err);
    })
    res.json(passMatches(password, req.body.password));
})

function passMatches(pass, target){
    if(pass === target){
        return JSON.stringify({result: 'success'});
    }
    else return JSON.stringify({result: 'failed'});
}

app.use(`/.netlify/functions/authenticate`, router);

module.exports = app;
module.exports.handler = serverless(app);

// app.listen(4000);