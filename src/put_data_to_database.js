const {MongoClient} = require("mongodb");
const {retrieveData, retrieveMultiData, putData, putManyData, updateData, updateManyData, deleteData, deleteManyData} = require('./database_tools.js');
const state_occupation = require('../datasets/states_occupation.json');

async function main(){
    const uri = "mongodb+srv://billtrancon12:LiamNgoan%40123@testing.76czn3k.mongodb.net/?retryWrites=true&w=majority"
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try{
        await client.connect();
        
        for(const element of state_occupation){
            await updateData(client, "Persona", "Persona", {state: element.state}, {$set : element}, {upsert: true});
        }
    }
    catch(err){
        console.error(err);
    }
    finally{
        await client.close();
    }
}

main().catch(console.error);