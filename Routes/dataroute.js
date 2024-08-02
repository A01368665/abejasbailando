
const express = require('express');
const router = express.Router();
const { getData, getChartData, postData,setMotorState, downloadData, updateIdealValue } = require('../Controllers/data.js');

router.get('/values', getData);
router.get('/data/:id', getChartData);
router.post('/data', postData);
router.post('/motor', setMotorState);
router.get('/download', downloadData);
router.post('/sensor/:id/ideal', updateIdealValue);
router.get('/main', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

module.exports = router;
