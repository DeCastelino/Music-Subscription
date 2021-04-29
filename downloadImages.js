const fs = require('fs');
const request = require('request');
const url = require('url');
const path_new = require('path');

var allMusic = JSON.parse(fs.readFileSync("a2.json", "utf8"));
allMusic['songs'].forEach(function(music) {

  let download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
      request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback)
    })
  }

  const url = music.img_url
  const base = path_new.basename(music.img_url);
  const ext = path_new.extname(music.img_url);
  const path = './uploads/' + base + ext;

  download(url, path, () => {
    console.log('Done!');
  })
})