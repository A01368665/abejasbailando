
const express = require('express');
const router = express.Router();
const { getData, getChartData, postData,setMotorState } = require('../Controllers/data.js');

router.get('/values', getData);
router.get('/data/:id', getChartData);
router.post('/data', postData);
router.post('/motor', setMotorState);
router.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
  });

module.exports = router;
