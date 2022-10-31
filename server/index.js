const http = require("http");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
let cors = require('cors');

// Create Express webapp
const app = express();
app.use(express.static(path.join(__dirname, ".")));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

// Create http server and run it
const server = http.createServer(app);
const port = process.env.PORT || 3000;
global.wss = new WebSocket.Server({server});

const router = require("./router");
app.use(router);

app.get('/*', (req, res) => {
    res.sendFile('twilio.min.js', {root: '.'});
})

server.listen(port, function () {
    console.log("Express server running on *:" + port);
});


