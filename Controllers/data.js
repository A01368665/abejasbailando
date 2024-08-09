const db = require('../firebase');
const { Parser } = require('json2csv');

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
  
      await Promise.all(Object.entries(sensors).map(async ([sensorId, value]) => {
        const { humidity, idealValue } = value;
  
        // Add new value to historical data
        await db.ref(`sensorData/${sensorId}/readings`).push({ time: timestamp, humidity });
  
        // Optionally update the ideal value if provided
        if (idealValue !== undefined) {
          await db.ref(`sensorData/${sensorId}/idealValue`).set(idealValue);
        }
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

const downloadData = async (req, res) => {
  try {
    // Fetch data from the database
    const sensorDataSnapshot = await db.ref('sensorData').once('value');
    const sensorData = sensorDataSnapshot.val();

    // Prepare an array to store the flattened data
    const flattenedData = [];

    // Iterate over each sensor and its readings
    for (const [sensorId, readings] of Object.entries(sensorData)) {
      for (const [readingId, reading] of Object.entries(readings)) {
        // Flatten the data structure
        flattenedData.push({
          readingId,
          sensorId,
          humidity: reading.humidity,
          time: reading.time
        });
      }
    }


    // Define fields for CSV
    const fields = ['readingId', 'sensorId', 'time', 'humidity'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(flattenedData);

    // Set the response headers and send the CSV file
    res.header('Content-Type', 'text/csv');
    res.attachment('sensor_data.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error downloading data:', error);
    res.status(500).json({ message: 'Error downloading data', error });
  }
};


const updateIdealValue = async (req, res) => {
  const { id } = req.params;
  const { idealValue } = req.body;

  try {
    // Validate the input
    if (idealValue === undefined || typeof idealValue !== 'number') {
      return res.status(400).json({ message: "Invalid idealValue provided" });
    }

    // Update the ideal value in the database
    await db.ref(`sensorData/${id}/idealValue`).set(idealValue);

    res.status(200).json({ message: `Ideal value for sensor ${id} updated to ${idealValue}` });
  } catch (error) {
    console.error("Error updating ideal value:", error);
    res.status(500).json({ message: "Error updating ideal value", error });
  }
};


  


module.exports = { getData, getChartData, postData, setMotorState, downloadData, updateIdealValue};