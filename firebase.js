const admin = require('firebase-admin');
const firebaseConfig = require('./firebaseconfig.json');



admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
  databaseURL: firebaseConfig.databaseURL,
});

const db = admin.database();

module.exports = db;

