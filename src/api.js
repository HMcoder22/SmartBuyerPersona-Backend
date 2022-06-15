const express = require("express");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

router.post("/", (req, res) => {
    const data = req.body;

    res.header = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
    }
    res.statusCode = 200;
    
    data.headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
    };
    data.statusCode = 200;

    if(data.gender === undefined || data.gender === ''){
        data.error = 'empty_gender'        
        res.json(data);
        return;
    }
    if((data.age === undefined || data.age === '') && (data.occupation === undefined || data.occupation === '')){
        data.error = 'empty_age_and_occupation';
        res.json(data);
        return;
    }
    if(data.country === undefined || data.country === '' || data.state === undefined || data.state === ''){
        data.error = 'empty_location';
        res.json(data);
        return;
    }
    res.json(data);
});

app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);