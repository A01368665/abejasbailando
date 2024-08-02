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
  
      // Step 1: Fetch current ideal values for all sensors
      const idealValuesSnapshot = await db.ref('sensorData').once('value');
      const idealValues = {};
      idealValuesSnapshot.forEach(sensorSnapshot => {
        const sensorId = sensorSnapshot.key;
        const sensorData = sensorSnapshot.val();
        if (sensorData.idealValue !== undefined) {
          idealValues[sensorId] = sensorData.idealValue;
        }
      });
  
      // Step 2: Calculate deviations and determine the maximum deviation sensor
      let maxDeviation = -1;
      let motorId = 0; // Default to 0 if no significant deviation
  
      await Promise.all(Object.entries(sensors).map(async ([sensorId, value]) => {
        const { humidity, idealValue } = value;
  
        // Add new value to historical data
        await db.ref(`sensorData/${sensorId}/readings`).push({ time: timestamp, humidity });
  
        // Optionally update the ideal value if provided
        if (idealValue !== undefined) {
          await db.ref(`sensorData/${sensorId}/idealValue`).set(idealValue);
        }
  
        // Calculate deviation
        const currentIdealValue = idealValues[sensorId] !== undefined ? idealValues[sensorId] : idealValue;
        const deviation = Math.abs(humidity - currentIdealValue);
  
        // Determine the sensor with the maximum deviation
        if (deviation > maxDeviation) {
          maxDeviation = deviation;
          motorId = parseInt(sensorId, 10); // Convert sensorId to number
        } else if (deviation === maxDeviation && motorId > parseInt(sensorId, 10)) {
          // If the deviation is the same, choose the sensor with the smaller numeric ID
          motorId = parseInt(sensorId, 10);
        }
      }));
  
      // Step 3: Update last received time
      await db.ref('lastReceivedTime').set(timestamp);
  
      // Step 4: Fetch current motor state
      const motorSnapshot = await db.ref('motor').once('value');
      const motorState = motorSnapshot.val();
  
      // Send response
      res.status(200).json({ message: "Data uploaded successfully", motor: motorState, activatedMotor: motorId });
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
    // Log incoming request data
    console.log(`Request received to update ideal value for sensor ${id}. Ideal value:`, idealValue);

    // Validate the input
    if (idealValue === undefined || isNaN(idealValue)) {
      console.error("Invalid idealValue provided:", idealValue);
      return res.status(400).json({ message: "Invalid idealValue provided" });
    }

    // Convert idealValue to a number
    const numericIdealValue = Number(idealValue);
    
    // Check if sensor data exists
    const sensorSnapshot = await db.ref(`sensorData/${id}`).once('value');
   
    
    if (!sensorSnapshot.exists()) {
    
      await db.ref(`sensorData/${id}`).set({
        idealValue: numericIdealValue,

      });
      console.log(`Sensor ${id} created with ideal value ${numericIdealValue}`);
      return res.status(201).json({ message: `Sensor ${id} created and ideal value set to ${numericIdealValue}` });
    }
ç
    await db.ref(`sensorData/${id}`).update({ idealValue: numericIdealValue });
    console.log(`Ideal value for sensor ${id} updated to ${numericIdealValue}`);

    res.status(200).json({ message: `Ideal value for sensor ${id} updated to ${numericIdealValue}` });
  } catch (error) {
    console.error("Error updating ideal value:", error);
    res.status(500).json({ message: "Error updating ideal value", error: error.message });
  }
};





  


module.exports = { getData, getChartData, postData, setMotorState, downloadData, updateIdealValue};
