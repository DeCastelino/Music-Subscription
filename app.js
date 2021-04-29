// importing necessary packages
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const fs = require('fs');
const request = require('request');
const path = require('path');
const AWS = require('aws-sdk');
const { LakeFormation } = require('aws-sdk');
const { prototype } = require('aws-sdk/clients/acm');

// Load Config
dotenv.config({ path: '.env' });

// initialise express
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: 'secret', saveUninitialized: true, resave: false }));

// Set DynamoDB config
const awsconfig = {
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

// Set config
AWS.config.update(awsconfig);

var docClient = new AWS.DynamoDB.DocumentClient();
const dynamoDB = new AWS.DynamoDB();
const s3 = new AWS.S3();

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
    // Making entries to database
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

// redirecting root directory to login page
app.get('/', (req, res) => {
    res.redirect('/login');
});

// login page method
app.get('/login', (req, res) => {
    res.render('login.ejs', { message: "" });
});

app.post('/login', (req,res) => {

    // Setting parameters for checking in database
    var params = {
       TableName: 'login',
       FilterExpression: '#email = :email and #password = :password',
       ExpressionAttributeNames: {
           '#email': 'email',
           '#password': 'password'
       },
       ExpressionAttributeValues: {
           ':email': req.body.email,
           ':password': req.body.password
       }
    };

    // scan database for possible login duplication
    docClient.scan(params, (err, data) => {
        if (data.Count == 1) {
            data.Items.forEach((item) => {
                req.session.username = item.username;   // assigning username to session variable for future use
            });
            res.redirect('/userArea');      // redirecting to userArea after successful login
        } else {
            res.render('login.ejs', { message: 'email or password is invalid' });
        }
    });
});

// register page method
app.get('/register', (req, res) => {
    res.render('register.ejs', { message: ""});
});

// register page POST method
app.post('/register', (req, res) => {

    // Check if email aready exists
    var params = {
        TableName: 'login',
        KeyConditionExpression: '#email = :email',
        ExpressionAttributeNames: {
            '#email': 'email'
        },
        ExpressionAttributeValues: {
            ':email': req.body.email
        }
    };
    // querying database for possible email duplication
    docClient.query(params, (err, data) => {
        if (data.Items == "") {
            params = {
                TableName: 'login',
                Item: {
                    email: req.body.email,
                    username: req.body.username,
                    password: req.body.password
                }
            }

            docClient.put(params, (err) => {
                if (err) {
                    console.error('Unable to add user to database');
                }
            });
            res.redirect('/login');
        }
        else {
            // Send error message to user
            res.render('register.ejs', { message: 'The email already exists' });
        }
    });
});

app.get('/userArea', (req, res) => {

    // Show all user subscribed music
    var params = {
        TableName: 'subscriptions',
        KeyConditionExpression: '#username = :username',
        ExpressionAttributeNames: {
            '#username': 'username'
        },
        ExpressionAttributeValues: {
            ':username': req.session.username
        }
    };

    docClient.query(params, (err, data) => {
        res.render('userArea.ejs', { username: req.session.username, data });
    });

    // Display results based on user query
})

app.listen(8080);