
const db = require('../firebase');
const getData = async (req, res) => {
    try {
      const sensorDataSnapshot = await db.ref('sensorData').once('value');
      const lastReceivedTimeSnapshot = await db.ref('lastReceivedTime').once('value');
      
      const sensorData = sensorDataSnapshot.val();
      const lastReceivedTime = lastReceivedTimeSnapshot.val();
  
      res.status(200).json({ sensorData, lastReceivedTime });
    } catch (error) {
      res.status(500).json({ message: "Error fetching data", error });
    }
  };
  
  const getChartData = async (req, res) => {
    const { id } = req.params;
    try {
      const snapshot = await db.ref(`sensorData/${id}`).once('value');
      const data = snapshot.val();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching chart data", error });
    }
  };

const postData = async (req, res) => {
    const { body } = req;
    const { sensors } = body;
  
    try {
      const timestamp = new Date().toISOString();
  
      // Update current values and add historical data for each sensor
      await Promise.all(Object.entries(sensors).map(async ([sensorId, value]) => {
        // Add new value to historical data
        await db.ref(`sensorData/${sensorId}`).push({ time: timestamp, humidity: value });
  
      }));
  
      // Update last received time
      await db.ref('lastReceivedTime').set(timestamp);
      

      const motorSnapshot = await db.ref('motor').once('value');
        const motorState = motorSnapshot.val();


      res.status(200).json({ message: "Data uploaded successfully", motor: motorState });
    } catch (error) {
        console.error("Error posting data:", error);
        res.status(500).json({ message: "Error posting data", error });
    }
  };


  const setMotorState = async (req, res) => {
    const { body } = req;
    const { motorId } = body;
    try {
        await db.ref('motor').set(motorId);
        console.log(`Motor state set to ${motorId}`);
        res.status(200).json({ success: true, message: `Motor state set to ${motorId}` });
    } catch (error) {
        console.error("Error setting motor state:", error);
        res.status(500).json({ success: false, message: "Error setting motor state", error });
    }
};
  


module.exports = { getData, getChartData, postData, setMotorState};