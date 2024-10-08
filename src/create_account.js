const express = require('express');
const cors = require('cors');
const app = express();
const bcrypt = require('bcryptjs');
const saltRounds = 10;  // salt for hashing
const router = express.Router();
// const validator = require('email-validator');
const validator = require('validator');
const {sendVerificationCode} = require('./sendmail');
const {putData, retrieveData} = require('./database_tools.js');
const {MongoClient} = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json({limit: '50mb'}));

async function addUSer(data){
    const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@hagosmarketing.8mru08u.mongodb.net/?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true }); // Create a client end-point

    try{
        await client.connect();
        // Check if the email already registered in the database
        const user = await retrieveData(client, "User", "Login", {username: data.username});
        const ret = JSON.parse(user.body);
        // The email is good to use
        if(ret === null){
            const result = await putData(client, "User", "Login", data);
            await client.close();
            return JSON.parse(result.body);
        }

        // The email already in the database
        await client.close();
        return {acknowledged: false, error: "Unavailable email"};
    }
    catch(err){
        console.error(err);
        return undefined;
    }
}


// sign up
// sign up
router.post("/login/sign_up", async function(req, res) {
    const err = [];
    const email_code = generateRandomToken(10);
    
    // Email and password field is not filled up
    if (req.body.email === '' || req.body.password === '' || req.body.re_password === '' || req.body.bname === '') {
        err.push("Missing field");
    }
    
    // The two passwords are not matched
    if (req.body.password !== req.body.re_password) {
        err.push('Unmatched password');
    }
    
    // The email is not valid
    if (!validator.isEmail(req.body.email)) {
        err.push('Invalid email');
    }

    // Validate password strength
    if (!validator.isStrongPassword(req.body.password, {
        minLength: 12, 
        minLowercase: 1,
        minUppercase: 1, 
        minNumbers: 1, 
        minSymbols: 1
    })) {
        err.push('Weak password');
    }

    // Check if there are any errors
    if (err.length !== 0) {
        res.json({ success: false, error: err });
        return;
    }

    // Hashing password
    const salt = await bcrypt.genSalt(saltRounds);
    const hash_password = await bcrypt.hash(req.body.password, salt);
    
    // Prepare user object
    var user = {
        fname: req.body.fname,  // Full name of the user
        username: req.body.email,
        password: hash_password,
        bname: req.body.bname,
        job: req.body.job,
        verify: false,   // User needs to verify
        access: false,
        email_authorized_code: {
            token: await bcrypt.hash(email_code.toString(), salt),   // Verification code
            issued: new Date(),
        }
    };

    var success = false;
    var error = "";
    await addUSer(user).then(res => { success = res.acknowledged; error = res.error; });

    if (success) {
        // Send authorization code for email
        await sendVerificationCode({
            authorized_code: email_code,
            username: user.username
        }, "Code verification for sign-up!")
        .catch(err => {
            console.log(err);
        });
    }
    
    res.json({ success: success, error: error });
});


function getRandomNumber(max){
    return Math.floor(Math.random() * max);
}

function generateRandomToken(max_length){
    var token = 0;
    for(let i = 1; i <= max_length; i++){
        token += getRandomNumber(10);
        token *= 10;
    }
    return token + getRandomNumber(10);
}

// app.use(`/.netlify/functions/create_account`, router);

module.exports = router;
// module.exports.handler = serverless(app);

// app.listen(4000);
