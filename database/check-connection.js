const pool = require('./connection');

async function checkConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 AS connected, DATABASE() AS databaseName');
    console.log(`Connected to MySQL database: ${rows[0].databaseName}`);
  } catch (error) {
    console.error(`MySQL connection failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkConnection();