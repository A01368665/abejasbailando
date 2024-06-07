// server.js
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

const dataRoutes = require('./Routes/dataroute.js');

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());
app.use('/api', dataRoutes);
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
