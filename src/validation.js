const express = require('express');
const cors = require('cors');
const app = express();
var state_occupation = {};
const {retrieveData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');

app.use(cors());
app.use(express.json({limit: '50mb'}));


async function getData(state){
    const uri = "mongodb+srv://billtrancon12:LiamNgoan%40123@testing.76czn3k.mongodb.net/?retryWrites=true&w=majority"
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try{
        await client.connect();
        const result = await retrieveData(client, "Persona", "Persona", {[state.toLowerCase()]: {$exists: true}});
        await client.close();
        return JSON.parse(result.body);
    }
    catch(err){
        console.error(err);
        return undefined;
    }
}

// Get data from '/api' post request
app.post("/api", async function(req, res){
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

    data.income = 0;
    if(state_occupation[data.state.toLowerCase()][data.occupation.toLowerCase()] !== undefined){
        data.income = state_occupation[data.state.toLowerCase()][data.occupation.toLowerCase()][0];
    }

    if(data.income === 0){
        data.error = 'job_unavailable';
        return data;
    }
    
    return data;
}
app.listen(4000);