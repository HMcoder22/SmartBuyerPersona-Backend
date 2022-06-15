const express = require("express");
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const router = express.Router();

router.get("/", (req, res) => {
    const data = req.body;
    console.log("hello");
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

app.use(cors());
app.use(express.json());
app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);