const express = require('express');
const cors = require('cors');
const app = express();
var persona = {};
const {retrieveData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');

app.use(cors());
app.use(express.json({limit: '50mb'}));


async function getData(state, job){
    const uri = "mongodb+srv://billtrancon12:LiamNgoan%40123@testing.76czn3k.mongodb.net/?retryWrites=true&w=majority"
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try{
        await client.connect();
        const result = await retrieveData(client, "Persona", "Persona_detail", {state: state, "occupation.job": job});
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
app.listen(4000);