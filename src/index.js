const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Basic route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Import routes
const admin = require('./admin');
const authenticate = require('./authenticate');
const code_verify = require('./code_verify');
const copy_generator = require('./copy_generator');

// Use routes
app.use('/admin', admin);
app.use('/authenticate', authenticate);
app.use('/code_verify', code_verify);
app.use('/copy_generator', copy_generator);


// Use environment variable for port
const port =  process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
