const express = require("express");
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const router = express.Router();
var persona = [];
const {MongoClient} = require('mongodb');
const {retrieveData} = require('./database_tools.js');
require('dotenv').config();

async function getData(state, job){
    const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    // const uri = "mongodb+srv://billtrancon12:LiamNgoan%40123@testing.76czn3k.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try{
        await client.connect();
        const result = await retrieveData(client, "Persona", "Information", {state: state, "occupation.job": job});
        await client.close();
        return JSON.parse(result.body);
    }
    catch(err){
        console.error(err);
        return undefined;
    }
}

app.use(express.json({limit: '50mb'}));
app.use(cors());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

// Get data from '/' post request
// https://splendorous-dieffenbachia-f3bbe0.netlify.app//.netlify/functions/api/copy_generator
router.post("/",  async function(req, res){
    await getData(req.body.state, req.body.occupation).then(e => {persona = e}).catch(console.error);
    res.json(validateInput(req.body));
})


function validateInput(data){
    // Check if the input for gender is empty
    if(data.gender === undefined || data.gender === ''){
        data.error = 'empty_gender'        
        return data;
    }
    // Check if the input for age is empty
    if(data.age === undefined || data.age === 0){
        data.error = 'empty_age';
        return data;
    }
    if(data.occupation === undefined || data.occupation === ''){
        data.error = 'empty_occupation';
        return data;
    }
    // Check if the input for country is empty
    if(data.country === undefined || data.country === '' || data.state === undefined || data.state === ''){
        data.error = 'empty_location';
        return data;
    }
    // Check if the input for age is a number
    if(isNaN(data.age) || data.age > 100 || data.age < 16){
        data.error = 'invalid_age';
        return data;
    }

    data.income = 0;
    if(persona !== null){
        data.income = persona.occupation.income;
    }

    if(data.income === 0){
        data.error = 'job_unavailable';
        return data;
    }

    if(data.gender === persona.gender){
        if(persona.img !== undefined) data.img = persona.img;
        if(persona.biography !== undefined) data.biography = persona.biography;
        if(persona.marital !== undefined) data.marital = persona.marital;
        if(persona.goals !== undefined) data.goals = persona.goals;
        if(persona.challenges !== undefined) data.challenges = persona.challenges;
        if(persona.name !== undefined) data.name = persona.name;
    }
    
    return data;
}

app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);