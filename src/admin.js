const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const router = express.Router();
const {updateData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');
const {retrieveData, deleteData} = require("./database_tools");

require('dotenv').config();

app.use(cors());
app.use(express.json({limit: '50mb'}));

const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });   // Create a client end-point

router.post("/manage/access", async function(req, res){
    console.log(req.body);

    let validUser = true;

    try{
        await client.connect();
        const result = await retrieveData(client, "User", "Login", {username: req.body.email});  // Get a user info based on the username
        if (result.body === "null")
            validUser = false;
        await client.close();
    }
    catch(err){
        console.error(err);
        validUser = false;
    }

    if (!validUser){
        res.json(JSON.stringify({success: false, error: 'invalid user'}));
        return;
    }

    try{
        await client.connect();

        //Very dangerous. Will put off for now.
        // if(req.body.deleted){
        //     await deleteData(client, "User", "Login", {username: req.body.email});
        // }

        await updateData(client, "User", "Login", {username: req.body.email}, {$set: {
                access: req.body.access}}, false)
            .catch(err => console.log(err));

        await client.close();
        res.json(JSON.stringify({success: true, error: ''}));
    }
    catch(err){
        console.error(err);
        res.json(JSON.stringify({success: false, error: 'update failed'}));
    }
})

async function getUsers() {
    try{
        await client.connect();
        const result = await client.db("User").collection("Login").find().toArray()
        await client.close();
        return JSON.stringify(result);
    }
    catch(err){
        console.error(err);
        return {success: false, error: 'failed to get users'};
    }
}

router.get("/accounts/getusers", async function(req, res){
    res.send(await getUsers());
})

app.use(`/.netlify/functions/admin`, router);

module.exports = app;
module.exports.handler = serverless(app);

// app.listen(4002);