const express = require('express');
const cors = require('cors');
const axios = require('axios');
const serverless = require('serverless-http');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json()); // to parse JSON request bodies

const router = express.Router();

const agent = new https.Agent({  
    rejectUnauthorized: false  // Ignore SSL certificate validation errors
});

// call image generator API (assumed it's a Flask server at the provided URL)
router.post('/generateImage', async function (req, res) {
    try {
        const { text, product } = req.body;

        const transformedData = {
            product: product || "Product",  // Set default if not provided
            text: text || "Default text"    // Set default if not provided
        };

        console.log("Requesting Image Generation with: ", transformedData);

        const response = await axios.post(`https://161.35.2.60:444/generate-image`, transformedData, {
            headers: {
                'Content-Type': 'application/json'  // Ensure JSON content type
            },
            httpsAgent: agent  
        });

        console.log("Image Generation API Response: ", response.data);

        // Return the generated image data (or whatever the response contains)
        return res.status(200).json(response.data);

    } catch (error) {
        console.error("Error during Image Generation: ", error);
        return res.status(500).json({ message: "Failed to generate image", error: error.message });
    }
});


// Define the prediction endpoint
router.post('/predict', async function (req, res) {

    const { gender, age, country, occupation, state } = req.body;

    // print the request body
    console.log(req.body);

    // Construct the payload with fixed values
    const payload = {
        gender: gender.toLowerCase(),  // Convert gender to lowercase
        age: parseInt(age, 10),        // Parse age to an integer
        country: "united states of america", // Fixed values
        occupation: "transportation inspectors",
        state: "illinois"
    };

    try {
        console.log("Requesting Prediction with: ", payload);

        // Send a POST request to the prediction API
        const response = await axios.post('http://161.35.2.60:5000/predict', payload);
        
       // console.log("Prediction API Response: ", response.data);
        
        // Send the response back to the client
        res.json(response.data);
    } catch (error) {
        console.error("Prediction request failed:", error);
        res.status(500).json({ error: "Failed to get prediction." });
    }
});

// generate advertisement
router.post('/generateAd', async function (req, res) {
    try {
        const { product, text } = req.body;

        // Transform data with defaults if necessary
        const transformedData = {
            product: product || "Product",  // Default to "Product" if not provided
            text: text || "Default text"    // Default to "Default text" if not provided
        };

        console.log("Requesting Advertisement Generation with: ", transformedData);

        // Send the POST request to the external ad generation API
        const response = await axios.post(`https://161.35.2.60:444/generate-ad`, transformedData, {
            headers: {
                'Content-Type': 'application/json'  // Ensure JSON content type
            },
            httpsAgent: agent  
        });

        console.log("Ad Generation API Response: ", response.data);

        // Return the response from the ad generation API to the client
        res.json(response.data);
    } catch (error) {
        console.error("Ad Generation request failed:", error);

        // Send a response back to the client indicating an error
        res.status(500).json({ error: "Failed to generate advertisement." });
    }
});

// Export the serverless handler
module.exports = router;
module.exports.handler = serverless(app);
