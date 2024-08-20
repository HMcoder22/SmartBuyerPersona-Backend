const express = require('express');
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const router = express.Router();
// const {updateData} = require('./database_tools.js');
// const {MongoClient} = require('mongodb');
// const {retrieveData, deleteData} = require("./database_tools");
const axios = require("axios").default;

require('dotenv').config();

app.use(cors());

router.get("/tweetdata", async function(req, res){
    console.log(req.body);

    let tweetdata = {};

    await axios.get('https://api.twitter.com/2/users/1483507394902646790/tweets', {
        headers: {
            'Authorization': `Bearer AAAAAAAAAAAAAAAAAAAAABL%2BhwEAAAAA1NFwgx6jBLXIJns77MidEAbVtqE%3DbtDbmwa2YtwkWMhD0kBBfRgjrdZzm5Cbytg4XRp0VsBlhEUaa7`
        }
    }).then(response => {
       tweetdata = response.data.data;
    }).catch(err => {
        console.error(err);
        res.json(JSON.stringify({success: false, error: 'Something went wrong with retrieving the tweet data'}));
    })

    tweetIds = tweetdata.map(tweet => tweet.id);
    //Loop through the tweetIds and get the likes and retweets for each tweet
    for (let i = 0; i < tweetIds.length; i++){
        await axios.get(`https://api.twitter.com/2/tweets?ids=${tweetIds[i]}&tweet.fields=public_metrics&expansions=attachments.media_keys&media.fields=public_metrics`, {
            headers: {
                'Authorization': `Bearer AAAAAAAAAAAAAAAAAAAAABL%2BhwEAAAAA1NFwgx6jBLXIJns77MidEAbVtqE%3DbtDbmwa2YtwkWMhD0kBBfRgjrdZzm5Cbytg4XRp0VsBlhEUaa7`
            }
        }).then(response => {
            tweetdata[i].likes = response.data.data[0].public_metrics.like_count;
            tweetdata[i].retweets = response.data.data[0].public_metrics.retweet_count;
            tweetdata[i].replies = response.data.data[0].public_metrics.reply_count;
            tweetdata[i].quotes = response.data.data[0].public_metrics.quote_count;
        }).catch(err => {
            console.error(err);
            res.json(JSON.stringify({success: false, error: 'Something went wrong with retrieving the tweet data'}));
        })

    }

    res.json(tweetdata)

})

router.get("/linkedindata", async function(req, res){
    const config = {
        method: 'get',
        url: 'https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:68139989&timeIntervals.timeGranularityType=MONTH&timeIntervals.timeRange.start=1640995200000&timeIntervals.timeRange.end=1672531199000',
        headers: {
            'LinkedIn-Version': '202206',
            'Authorization': 'Bearer AQXGIFvikPcUyuaB0GqEj-NkVok2ajhK1qokMPocwDXcfO3qG8gTSZgVJ-RgSODhJ3FegyiLStyOa7_9f15U7U5PPtg1YBOL3Ae4sYiQxxJDVbYmeZzSaN_L99LKzmGyHm5mP2paK8UdBQaaHqRBK0qqlaD5nzh4W3u5u7nlqljie5bZlFRBXf3sCOQn8l23JM34OGIYgW2SjO4Hjl4v2nyKXSH99Tq_x8T9FH3gEh56x_2IX8dsKTmNQ6ttaAUIZbby2ppz7CiHzMw0qETa-92ICMmWcUI35ZntL0v-owrfvLK6CDE5Phcuyud-ulGp8rXFLOcdh3MIPu16c61ip1LhmvTUdA',
            'Cookie': 'lidc="b=OB55:s=O:r=O:a=O:p=O:g=2873:u=6:x=1:i=1667327870:t=1667409476:v=2:sig=AQFhccJieyWOfuvmcaWqb3LqdvjffWJ5"; bcookie="v=2&2e8c21d9-e82a-41cf-8bca-2c850e704a05"'
        }
    };

    let linkedin = {}

    await axios(config)
        .then(function(response) {

            let yearly_engagement = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

            for (let i = 0; i < response.data.elements.length; i++) {
                let total_engagement = 0
                total_engagement = response.data.elements[i].totalShareStatistics.uniqueImpressionsCount + response.data.elements[i].totalShareStatistics.shareCount + response.data.elements[i].totalShareStatistics.clickCount + response.data.elements[i].totalShareStatistics.likeCount + response.data.elements[i].totalShareStatistics.impressionCount + response.data.elements[i].totalShareStatistics.commentCount

                yearly_engagement[i] = total_engagement
            }

            linkedin = {yearly_engagement}
            console.log(linkedin)
        })
        .catch(function(error) {
            console.log(error);
        });

    res.json(linkedin)

})

router.get("/facebookdata", async function(req, res){
    const config = {
        method: 'get',
        url: 'https://graph.facebook.com/v15.0/112339397206271/insights?metric=page_post_engagements%2Cpage_engaged_users%2Cpage_impressions_unique%2Cpage_impressions%2Cpost_engaged_users%2Cpost_engaged_fan%2Cpost_clicks%2Cpage_posts_impressions%2Cpage_posts_impressions_unique&period=day&date_preset=this_year',
        headers: {
            'Authorization': 'Bearer EAAJMQT8BoWgBADaCzd2kHjz61KpayxfVpHy3LG7kk2tD0DoXUiQ5w1xmaGDYlIZAuj8sNeXSO4wmcEgBefTpIvE88rNqquZATFqZCdZAKFlZBhRHjKSRIuNjFZCzah7lvbzbcaxUz9KOfq3S1TRtASA3sBdWh3FyCRqlZBvzFTMu8rFz4d8hxkmaAog4ZCuViHQZD'
        }
    };

    let facebook = {}
    await axios(config)
        .then(function(response) {

            let yearly_engagement = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

            for (let i = 0; i < response.data.data.length; i++) {
                for (let j = 0; j < response.data.data[i].values.length; j++) {

                    const str = (response.data.data[i].values[j]["end_time"])
                    const num_month = str.slice(5, 7);
                    let engagement = response.data.data[i].values[j]["value"]
                    //console.log(num_month)

                    yearly_engagement[num_month - 1] += engagement
                }
            }

            facebook = {yearly_engagement}

            console.log(facebook)
        })
        .catch(function(error) {
            console.log(error);
        });

    res.json(facebook)
})


module.exports = router;
module.exports.handler = serverless(app);