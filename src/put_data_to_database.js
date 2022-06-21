const {MongoClient} = require("mongodb");
const {retrieveData, retrieveMultiData, putData, putManyData, updateData, updateManyData, deleteData, deleteManyData} = require('./database_tools.js');
const state_occupation = require('../datasets/states_occupation.json');

async function main(){
    const uri = "mongodb+srv://billtrancon12:LiamNgoan%40123@testing.76czn3k.mongodb.net/?retryWrites=true&w=majority"
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try{
        await client.connect();

        await updateData(client, "Persona", "Persona_detail", {state: "California", "occupation.job": "Sales Managers"}, 
        {$set : {
            name: "Sarah",
            gender: "Female",
            marital: "Married, 2 kids",
            biography: "Sarah tends to eat out regularly, and when at home, weekends are consumed with home improvement and remodeling projects.",
            shopping: {
                method: {
                    how: {
                        in_store: 1620,
                        online: 1360
                    },
                    where: [{
                        location: "Banana Public",
                        frequency: 1231
                    },{
                        location: "Nike",
                        frequency: 872
                    },{
                        location: "Macy",
                        frequency: 1023
                    },{
                        location: "Other",
                        frequency: 982
                    }]
                },
                reach: ["Social media", "Radio", "Cable news network", "Email"]
            },
            social: ["YouTube", "Facebook", "Twitter", "LinkedIn"],
            img: "https://lh6.googleusercontent.com/Jw3mTR7BHJCWts9Yg4vJbfqyaPbyAkNII7t_8CZpjg29kbS1XfZR7DXWlXGic9w4LwnHup4ZUS0wq8DcRr5XsZ9B8hSvKnAeAIqQsKqo92R9KpVoyHVOqNCbWWYPBaqfgX1jXhV74cEnEsXPc1o",
            goals: [
                "Cautious about buying and protecting investments",
                "Like to work from home when possible",
                "Embrace the convenience of completing tasks on a mobile device",
                "Buy children's clothes and toys frequently"
            ],
            challenges: [
                "Is still paying off home mortgages",
            ]
        }}, {upsert: true});
    }
    catch(err){
        console.error(err);
    }
    finally{
        await client.close();
    }
}

main().catch(console.error);