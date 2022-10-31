const dotenv = require("dotenv");
const cfg = {};

if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: ".env" });
} else {
  dotenv.config({ path: ".env.example", silent: true });
}

cfg.port = process.env.PORT || 3000;

cfg.accountSid = process.env.TWILIO_ACCOUNT_SID;
cfg.twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
cfg.callerId = process.env.TWILIO_CALLER_ID;
cfg.apiKey = process.env.TWILIO_API_KEY;
cfg.apiSecret = process.env.TWILIO_API_SECRET;
cfg.pushCredSid = process.env.TWILIO_PUSH_CREDENTIAL_SID;
cfg.twilioAuthToken = process.env.TWILIO_AUTHTOKEN;

cfg.assemblyAIKey = process.env.ASSEMBLYAI_KEY;

cfg.callType = "CaptionAndType"; // Caption or CaptionAndType | Stream or Connect
cfg.voice = "F"; // F or I

// Export configuration object
module.exports = cfg;
