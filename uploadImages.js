const { LakeFormation } = require('aws-sdk');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');

// Load Config
dotenv.config({ path: '.env' });
const app = express();
app.use(express.urlencoded({ extended: false }));

// Set DynamoDB config
const awsconfig = {
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

AWS.config.update(awsconfig);
const s3 = new AWS.S3();

// Set config
AWS.config.update(awsconfig);
const allMusic = JSON.parse(fs.readFileSync("a2.json", "utf8"));
allMusic['songs'].forEach(function(music) {

    var base = path.basename(music.img_url);    // retrieve file name
    var file_path = './uploads/' + base;

    var uploadParams = { Bucket: 'music-subscription-bucket', Key: '', Body: '', ACL: 'public-read' };
    var fileStream = fs.createReadStream(file_path);
    fileStream.on('error', (err) => {
        console.log('File error: ', err);
    });
    uploadParams.Body = fileStream;
    uploadParams.Key = base;

    s3.upload(uploadParams, (err, data) => {
        if (err) {
            console.log('Error: ', err);
        }
        if (data) {
            console.log('Upload Success: ', data.Location);
        }
    });
});