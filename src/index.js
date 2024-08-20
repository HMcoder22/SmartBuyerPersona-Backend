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

// Use routes
app.use('/admin', admin);
app.use('/authenticate', authenticate);

// Use environment variable for port
const port =  process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
