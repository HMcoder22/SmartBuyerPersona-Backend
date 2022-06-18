const express = require("express");
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const router = express.Router();
const state_occupation = require('../datasets/states_occupation.json');
const {MongoClient} = require("mongodb");


app.use(cors());
app.use(express.json({limit: '50mb'}));

async function getData(){
    const uri = "mongodb+srv://billtrancon12:LiamNgoan%40123@testing.76czn3k.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try{
        client.connect();
    }
    catch(err){
        console.error(err);
    }
    finally{
        client.close();
    }
}

// Get data from '/' post request
router.post("/", function(req, res){
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
    // Get the income for the specific job in the specific state
    for(let i = 0; i < state_occupation.length; i++){
        if(state_occupation[i].state === data.state){
            for(let j = 0; j < state_occupation[i].occupation.length; j++){
                if(state_occupation[i].occupation[j].job === data.occupation){
                    data.income = state_occupation[i].occupation[j].income;
                }
            }
        }
    }

    if(data.income === 0){
        data.error = 'job_unavailable';
        return data;
    }
    
    return data;
}

app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);