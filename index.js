const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");

const app = express().use(bodyParser.json());

// ===== Tokens galing sa Environment (Render) =====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// ===== Function para mag-reply =====
function callSendAPI(sender_psid, response) {
  const request_body = {
    recipient: { id: sender_psid },
    message: response,
  };

  request(
    {
      uri: "https://graph.facebook.com/v17.0/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("✅ Message sent!");
      } else {
        console.error("❌ Unable to send message:" + err);
      }
    }
  );
}

// ===== Webhook Verification =====
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// ===== Webhook Receiver =====
app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(function (entry) {
      const webhook_event = entry.messaging[0];
      console.log(webhook_event);

      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message && webhook_event.message.text) {
        handleMessage(sender_psid, webhook_event.message.text);
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ===== Command Handler =====
function handleMessage(sender_psid, received_message) {
  let response;

  switch (received_message.toLowerCase()) {
    case "/hello":
      response = { text: "👋 Hello boss, kumusta?" };
      break;
    case "/help":
      response = { text: "📌 Available commands:\n/hello - Greet\n/help - Show commands" };
      break;
    default:
      response = { text: "❓ Hindi ko kilala yung command. Try /help" };
      break;
  }

  callSendAPI(sender_psid, response);
}

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
