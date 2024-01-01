var express = require('express');

express.static.mime.define({'text/javascript': ['mjs']});
var app = express();

app.use(express.static('.'));

//Serves all the request which includes /images in the url from Images folder
app.use('/images', express.static(__dirname + '/node_modules'));
app.use('/', express.static(__dirname));

var server = app.listen(7000);

/*
const express = require('express');
const app = express();
const port = 6000;
app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
*/