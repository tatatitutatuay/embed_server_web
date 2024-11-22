const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set } = require("firebase/database");

const app = express();
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY, 
  authDomain: process.env.FIREBASE_AUTH_DOMAIN, 
  databaseURL: process.env.FIREBASE_DATABASE_URL, 
  projectId: process.env.FIREBASE_PROJECT_ID, 
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET, 
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID, 
  appId: process.env.FIREBASE_APP_ID 
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

app.use(bodyParser.json());

const verifySignature = (req, res, next) => {
  const signature = req.headers['x-line-signature'];
  const body = JSON.stringify(req.body);
  const hash = crypto.createHmac('sha256', process.env.LINE_CHANNEL_SECRET)
    .update(body).digest('base64');

  if (hash === signature) {
    next();
  } else {
    res.status(403).send('Invalid signature');
  }
};

app.post('/', verifySignature, (req, res) => {
  console.log('Webhook received:', req.body);

  req.body.events.forEach((event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      const messageText = event.message.text;
      if (messageText === '@water') {
        const dbRef = ref(database, `water`);
        set(dbRef, { status: 1 })
          .then(() => {
            console.log("Message saved to Firebase.");
          })
          .catch((error) => {
            console.error("Error saving to Firebase:", error);
          });
      }
    }
  });

  res.status(200).send('OK');
});

module.exports = app;
