// server.js
const express = require('express');
const app = express();
const cors = require('cors');
const dataRoutes = require('./Routes/dataroute.js');

const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use('/api', dataRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
