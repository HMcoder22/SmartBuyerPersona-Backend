const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const router = express.Router();
const {retrieveData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json({limit: '50mb'}));

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

router.post('/user', async function(req, res){
    const user = await getUserLoginInfo(req.body.username).catch(err => console.log(err));
    
    if(user === null){
        res.json(JSON.stringify({success: false, error: 'Something went wrong'}))
        return;
    }

    res.json(JSON.stringify({success: true, user:{
        username: user.username,
        name: user.fname,
        birthdate: user.birthdate,
        job: user.job,
        phone: user.phone,
        bname: user.bname
    }, error : ''}))
})

app.use(`/.netlify/functions/retrieveData`, router);

module.exports = app;
module.exports.handler = serverless(app);
 
// app.listen(4005);