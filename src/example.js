const {retrieveMultiData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');
require('dotenv').config();

async function getData(){
    const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try{
        await client.connect();
        const result = await retrieveMultiData(client, "PersonaData", "", {gender: "female", age: {$gte: 40, $lte: 40}, state: "alabama"});
        const ret = JSON.parse(result.body);
        ret.forEach(element => {
            console.log(element);
        });
        await client.close();
        return JSON.parse(result.body);
    }
    catch(err){
        console.error(err);
        return undefined;
    }
}

getData().catch(err => console.log(err));