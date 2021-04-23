// importing necessary packages
const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const AWS = require('aws-sdk');
const { LakeFormation } = require('aws-sdk');

// Load Config
dotenv.config({ path: '.env' });

// initialise express
const app = express();

// Set DynamoDB config
const awsconfig = {
    region: 'us-east-1',
    endpoint: 'http://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

// Set config
AWS.config.update(awsconfig);

var docClient = new AWS.DynamoDB.DocumentClient();
var dynamoDB = new AWS.DynamoDB();

// Creating parameters for create table - music
var params = {
    TableName: 'music',
    KeySchema: [
        { AttributeName: 'artist', KeyType: 'HASH' },   // Partition key
        { AttributeName: 'title', KeyType: 'RANGE' }    // Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: 'artist', AttributeType: 'S' },
        { AttributeName: 'title', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }
};

// Creating music table
dynamoDB.createTable(params, (err, data) => {
    if (err) {
        console.error('Unable to create table. Error JSON: ', JSON.stringify(err, null, 2));
    } else {
        console.log('Created table. Table description JSON: ', JSON.stringify(data, null, 2));
    }
});

// Importing data into database
var allMusic = JSON.parse(fs.readFileSync("a2.json", "utf8"));
allMusic['songs'].forEach(function(music) {
    var params = {
        TableName: 'music',
        Item: {
            artist: music.artist,
            title: music.title,
            year: music.year,
            web_url: music.web_url,
            img_url: music.img_url
        }
    };
    
    docClient.put(params, (err, data) => {
        if (err) {
            console.error('Unable to add music', music.title, ". Error JSON: ", JSON.stringify(err, null, 2));
        } else {
            console.log('PutItem succeeded:', music.title);
        }
    });
});

// set view engine to ejs
app.set('view engine', 'ejs');

// landing page method
app.get('/', (req, res) => {
    res.render('index.ejs');
});

// login page method
app.get('/login', (req, res) => {
    res.render('login.ejs');
});

// register page method
app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.listen(8080);