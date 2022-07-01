const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const gibberish = require('gibberish-detective')();
const app = express();
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

gibberish.set("useCache", false);
var copy_content = [];

// Basic setting up for the backend
app.use(express.json({limit: '100mb'}));
app.use(cors());

// Configuration for openai
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
  
async function getCopy(description, tone, type){  
    const completion = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: (type === 'product_checkbox') ? `Write a written copy content for social media for Facebook that has a ${tone} tone. \n\n Product: ${description}` : `Write a written copy content for social media for Facebook that has a ${tone} tone. \n\n Service: ${description}`,
        max_tokens: 200,
        temperature: 1,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.7
    });
    return completion.data.choices[0].text;
}

async function getHashtag(description, tone, type){  
    const completion = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: (type === 'product_checkbox') ? `Write only one completed hashtag for social media that has a ${tone} tone. \n\n Product: ${description}` : `Write a hashtag content for social media for Facebook that has a ${tone} tone. \n\n Service: ${description}`,
        max_tokens: 50,
        temperature: 1,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.7
    });
    return completion.data.choices[0].text;
}


app.post("/copy_generator/written", async function(req, res){
    if(gibberish.detect(req.body.description)){
        res.json({
            statusCode: 200,
            headers:{
                "Content-Type": "application/json"
            },
            body: {data : "This is gibberish"}
        });
    }
    else{
        const content = [];
        for(let i = 0; i < 5; i++){
            content.push({
                type: "written",
                value: await getCopy(req.body.description, req.body.tone, req.body.product_or_services)
            });
        }

        res.json({
            statusCode: 200,
            headers:{
                "Content-Type": "application/json"
            },
            body: {data: content}
        })
    }
})

app.post("/copy_generator/hashtag", async function(req, res){
    if(gibberish.detect(req.body.description)){
        res.json({
            statusCode: 200,
            headers:{
                "Content-Type": "application/json"
            },
            body: {data : "This is gibberish"}
        });
    }
    else{
        const content = [];
        console.log(req.body.product_or_services);
        for(let i = 0; i < 5; i++){
            content.push({
                type: "hashtag",
                value: await getHashtag(req.body.description, req.body.tone, req.body.product_or_services)
            });
        }

        res.json({
            statusCode: 200,
            headers:{
                "Content-Type": "application/json"
            },
            body: {data: content}
        })
    }
})

app.listen(4000);

