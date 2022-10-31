const Router = require("express").Router;
const {tokenGenerator, voiceResponse, call, voiceResponse2, sendmsg, endCall, sendWSMessage} = require("./handler");
const config = require("./config");

const router = new Router();

router.get("/token", (req, res) => {
    let id = req.query.id;
    console.log("Identity: " + id);
    res.send(tokenGenerator(id));
});

router.post("/voice", (req, res) => {
    console.log("voice")
    res.set("Content-Type", "text/xml");
    if (config.callType === "Caption" || config.callType === "Stream") {
        res.send(voiceResponse(req.body)); // sound, but no typing (incoming and outgoing)
    } else {
        voiceResponse2(req, res); // no sound, but typing (incoming only)
    }
});

router.get("/sendmsg", (req, res) => {
    sendmsg(req, res);
});

router.get("/call", (req, res) => {
    call(req, res);
});

router.get("/endcall", (req, res) => {
    endCall(req, res);
});

router.get("/sendIncoming", (req, res) => {
    sendWSMessage({
        event: "incoming_call",
        From: "dc",
        CallSid: "123",
    });
    res.send("incoming sent");
})

router.get("/setCallType", (req, res) => {
    config.callType = req.query.callType;
    res.send(config.callType);
    console.log(config.callType);
});

router.get("/setVoice", (req, res) => {
    config.voice = req.query.voice;
    res.send(config.voice);
    console.log(config.voice);
});

module.exports = router;
