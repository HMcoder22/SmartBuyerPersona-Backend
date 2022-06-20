const express = require("express");
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const router = express.Router();
// const state_occupation = require('../datasets/states_occupation.json');
var state_occupation = [];
const {MongoClient} = require('mongodb');
const {retrieveMultiData} = require('./database_tools.js');

async function getData(state){
    const uri = "mongodb+srv://billtrancon12:LiamNgoan%40123@testing.76czn3k.mongodb.net/?retryWrites=true&w=majority"
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try{
        await client.connect();
        const result = await retrieveMultiData(client, "Persona", "Persona", {state: state});
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
router.post("/",  async function(req, res){
    await getData(req.body.state).then(e => {state_occupation = e}).catch(console.error);
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

    data.income = state_occupation[data.state][data.occupation][0];
    // Get the income for the specific job in the specific state
    // for(let i = 0; i < state_occupation[0].occupation.length; i++){
    //     if(state_occupation[0].occupation[i].job === data.occupation){
    //         data.income = state_occupation[0].occupation[i].income;
    //     }
    // }

    if(data.income === undefined){
        data.error = 'job_unavailable';
        return data;
    }
    
    return data;
}

app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);