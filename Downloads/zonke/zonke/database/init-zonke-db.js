require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'zonke'
};

const schemaFile = path.join(__dirname, 'zonke_database (1).sql');

async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
    await connection.query(`USE \`${config.database}\`;`);

    const sql = fs.readFileSync(schemaFile, 'utf8');
    await connection.query(sql);

    console.log(`Initialized database: ${config.database}`);
  } finally {
    await connection.end();
  }
}

ensureDatabase().catch((error) => {
  console.error('Database initialization failed:', error.message);
  process.exit(1);
});
