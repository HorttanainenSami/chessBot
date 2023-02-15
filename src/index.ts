const express = require('express');
const moveRouter = require('./moveRouter');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());
app.use('/', moveRouter);
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
