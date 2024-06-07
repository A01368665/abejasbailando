const admin = require('firebase-admin');
const firebaseConfig = require('./firebaseconfig.json');

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
  databaseURL: firebaseConfig.databaseURL
});

const db = admin.database();

const initialData = {
  sensors: {
    square1: 30,
    square2: 45,
    square3: 50,
    square4: 20,
    square5: 60,
    square6: 35,
    square7: 40,
    square8: 55,
    circle1: 50,
    circle2: 65
  },
  sensorData: {
    square1: [
      { time: "2024-06-06T10:00:00Z", humidity: 30 },
      { time: "2024-06-06T10:05:00Z", humidity: 31 }
    ],
  },
  lastReceivedTime: "2024-06-06T10:10:00Z"
};

db.ref().set(initialData)
  .then(() => {
    console.log("Database populated successfully!");
    process.exit();
  })
  .catch((error) => {
    console.error("Error populating database:", error);
    process.exit(1);
  });
