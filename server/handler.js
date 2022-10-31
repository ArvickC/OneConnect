const VoiceResponse = require("twilio").twiml.VoiceResponse;
const AccessToken = require("twilio").jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const WebSocket = require("ws");
const config = require("./config");
const {Stream, Connect} = require("twilio/lib/twiml/VoiceResponse");
const WaveFile = require("wavefile").WaveFile;
const fs = require('fs');
const util = require('util');
const textToSpeech = require('@google-cloud/text-to-speech');

const URL_ID = "//"
const WSS_URL = `wss://${URL_ID}.ngrok.io/`;
const HTTPS_URL = `https://${URL_ID}.ngrok.io/`;

const GOOGLE_PROJECTID = 'text-calls';
const GOOGLE_KEYFILENAME = 'text-calls-0ff9f9d884f0.json';

const t2sclient = new textToSpeech.TextToSpeechClient({GOOGLE_PROJECTID, GOOGLE_KEYFILENAME});
let tclient = require('twilio')(config.accountSid, config.twilioAuthToken);

let identity = "alice";
let chunks = [];
let token = "";
let messageDone = true;
let call_sid = "";
let assembly = null;


exports.tokenGenerator = function tokenGenerator(id) {
    identity = id
    const accessToken = new AccessToken(
        config.accountSid,
        config.apiKey,
        config.apiSecret
    );
    accessToken.identity = identity;
    const grant = new VoiceGrant({
        outgoingApplicationSid: config.twimlAppSid,
        incomingAllow: true,
        pushCredentialSid: config.pushCredentialSid,
    });
    accessToken.addGrant(grant);

    // Include identity and token in a JSON response
    token = accessToken.toJwt();
    return {
        identity: identity,
        token: accessToken.toJwt(),
    };
};

exports.sendWSMessage = function sendWSMessageWorker(msg) {
    sendWSMessage(msg);
}

function sendWSMessage(msg) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
        }
    });
}


// CALL HANDLER
exports.voiceResponse = function voiceResponse(requestBody) {
    assembly = new WebSocket("wss://api.assemblyai.com/v2/realtime/ws?sample_rate=8000", {headers: {authorization: config.assemblyAIKey}});

    console.log(requestBody);
    const toNumberOrClientName = requestBody.To;
    let xml = "";

    // INCOMING CALL
    if (toNumberOrClientName == config.callerId) {
        console.log("INCOMING CALL");

        xml =
            `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Start><Stream url='${WSS_URL}' /></Start>
      <Dial><Client>alice</Client></Dial>
    </Response>`
    }
    // OUTGOING CALL
    else if (requestBody.To) {
        console.log("OUTGOING CALL");

        const dial = isAValidPhoneNumber(toNumberOrClientName)
            ? `<Dial callerId='${config.callerId}'><Number>'${requestBody.To}'</Number></Dial>`
            : `<Dial><Client>alice</Client></Dial>`

        xml =
            `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Start><Stream url='${WSS_URL}' track='outbound_track'/></Start>
      ${dial}
    </Response>`
    }
    // ERROR
    else {
        xml =
            `<?xml version="1.0" encoding="UTF-8"?>
    <Say>Thanks for calling</Say>`
    }

    console.log(xml);
    return xml;
};


// INCOMING CALL (with typing)
exports.voiceResponse2 = function voiceResponse2(req, res) {
    assembly = new WebSocket("wss://api.assemblyai.com/v2/realtime/ws?sample_rate=8000", {headers: {authorization: config.assemblyAIKey}});

    sendWSMessage({
        event: "incoming_call",
        From: req.body.From,
        CallSid: req.body.CallSid,
    });
    console.log(req.headers.host);
    res.set("Content-Type", "text/xml");
    res.send(`<Response><Connect><Stream url='${WSS_URL}' /></Connect></Response>`);
};

// OUTGOING CALL (with typing)
exports.call = function call(req, res) {
    assembly = new WebSocket("wss://api.assemblyai.com/v2/realtime/ws?sample_rate=8000", {headers: {authorization: config.assemblyAIKey}});

    let to = req.query.to;
    tclient.calls
        .create({
            twiml: `<Response><Connect><Stream url='${WSS_URL}' /></Connect></Response>`,
            to: to,
            from: `${config.callerId}`
        })
        .then((call) => {
            console.log(call.sid);
            res.send(call.sid);
        }).catch((err) => {
        console.log(err)
        res.send("error")
    });
}


// END CALL
exports.endCall = function endCall(req, res) {
    tclient.calls(req.query.sid).update({status: "completed"})
        .then(call => {
            console.log(call.sid);
            res.send(call.sid);
        }).catch(err => {
        console.log(err);
        res.send("error");
    });
};


function isAValidPhoneNumber(number) {
    return /^[\d\+\-\(\) ]+$/.test(number);
}

// HANDLE TWILIO WEB SOCKET
wss.on("connection", function connection(ws) {
    console.log("New Connection Initiated");

    ws.on("message", function incoming(message) {
        if (!assembly)
            return console.error("AssemblyAI's WebSocket must be initialized.");

        const msg = JSON.parse(message);
        switch (msg.event) {
            case "connected":
                console.log(`A new call has connected.`);
                setupAssemblyAIWebSocketHandler3();
                break;
            case "start":
                callEnded = false;
                console.log(`Starting Media Stream ${msg.streamSid}`);
                ss = msg.start.streamSid;
                break;
            case "media":
                let wav = mula2wav(msg.media.payload); // msg comes from phone client
                sendAudioForSpeechToTextToAI(wav); // send audio to Assembly AI for converting to text
                if (callEnded) break;
                sendTextAudioToPhoneClient(); // send any queued up text messages to phone client
                break;
            case "stop":
                console.log(`Call Has Ended`);
                callEnded = true;
                assembly.send(JSON.stringify({terminate_session: true}));
                sendWSMessage({
                    event: "away-hangup",
                });
                break;
            case "mark":
                messageDone = true;
            //console.log("mark")
        }
    });
});


// SEND TEXT MESSAGE
exports.sendmsg = function sendmsg(req, res) {
    let msg = req.query.msg;
    queue.push(msg);
    console.log(msg);
    res.send('queued');
};


// AUDIO FORMAT CONVERSIONS

function mula2wav(data) {
    let wav = new WaveFile();
    wav.fromScratch(1, 8000, "8m", Buffer.from(data, "base64"));
    wav.fromMuLaw();
    return wav;
}

function wav2mula(wav) {
    wav.toBitDepth('8')
    wav.toSampleRate(8000)
    wav.toMuLaw()
    return wav;
}


// ASSEMBLY AI (speech to text)

let lastId = 0;
let lastmsg = "";

function setupAssemblyAIWebSocketHandler3() {
    assembly.onerror = console.error;
    // When you receive transcribe data from Assembly AI, send it to client.
    assembly.onmessage = (assemblyMsg) => {
        const res = JSON.parse(assemblyMsg.data);
        //console.log("audio_start: " + res.audio_start + " text: " + res.text);
        if (!res.text || (lastId == res.audio_start && lastmsg == res.text)) return;
        lastId = res.audio_start;
        lastmsg = res.text;
        sendWSMessage({
            event: "interim-transcription",
            text: res.text,
            audio_start: res.audio_start,
        });
    };
}


function sendAudioForSpeechToTextToAI(wav) {
    const twilio64Encoded = wav.toDataURI().split("base64,")[1];
    const twilioAudioBuffer = Buffer.from(twilio64Encoded, "base64");
    chunks.push(twilioAudioBuffer.slice(44));
    // We have to chunk data b/c twilio sends audio durations of ~20ms and AAI needs a min of 100ms
    if (chunks.length >= 5) {
        const audioBuffer = Buffer.concat(chunks);
        const encodedAudio = audioBuffer.toString("base64");
        assembly.send(JSON.stringify({audio_data: encodedAudio}));
        chunks = [];
    }
}


// GOOGLE AI (text to speech)

let queue = []
//queue.push("Hi!")
//queue.push("How are you doing?")
//queue.push("Let's go out for dinner tonite")

const text2speechSetting = {
    audioConfig: {
        audioEncoding: "LINEAR16",
        pitch: 0,
        speakingRate: 1.00
    },
    input: {
        text: "This is a test of Google's text to speech! Let's see if it works."
    },
    voice: {
        languageCode: "en-US",
        name: `en-US-Wavenet-F`,
    },
    outputFileName: "output1.mp3"
}

async function text2speech(text) {
    text2speechSetting.input.text = text;
    text2speechSetting.voice.name = `en-US-Wavenet-${config.voice}`;
    const [response] = await t2sclient.synthesizeSpeech(text2speechSetting);
    return response;
}

function sendTextAudioToPhoneClient() {
    while (queue.length > 0 && messageDone) {
        messageDone = false;
        let text = queue.shift();
        console.log(text)
        text2speech(text).then((speechResponse) => {
            let wav = new WaveFile(speechResponse.audioContent)
            let mula = wav2mula(wav)
            let payload = Buffer.from(mula.data.samples).toString('base64');

            const msg = {
                event: "media",
                streamSid: ss,
                media: {
                    track: "outbound",
                    payload: payload
                },
            }
            sendWSMessage(msg);
            const markmsg = {
                event: "mark",
                streamSid: ss,
                mark: {
                    name: "playback_complete"
                }
            };
            sendWSMessage(markmsg);
        });
    }

}