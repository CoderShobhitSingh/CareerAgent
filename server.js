require('dotenv').config();
const app = require('./src/app');
const connectToDB = require('./src/config/database');

const port = process.env.PORT;

async function startServer() {
  try {
    await connectToDB();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB; server was not started:', error);
    process.exitCode = 1;
  }
}

startServer();