
import amqplib from 'amqplib';
import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import {Connector} from '@google-cloud/cloud-sql-connector';

// Load .env file
dotenv.config();

// Either load google CloudSQL options or just use values from the .env file
let connector= null;
let clientOpts= {};
if( process.env.CLOUD_SQL_CONNECTION ) {
  connector = new Connector();
  clientOpts = await connector.getOptions({
    instanceConnectionName: process.env.CLOUD_SQL_CONNECTION,
    ipType: 'PUBLIC',
  });
} else {
  clientOpts= {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT)
  };
}

// Create connection pool
const pool = await mysql.createPool({
  ...clientOpts,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});


// Run REST API
const app= express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen( parseInt(process.env.REST_PORT), () => {
  console.log(`Example app listening on port ${process.env.REST_PORT}`)
})

// Do simple test query with connection
const conn = await pool.getConnection();
const [result] = await conn.query(`SELECT NOW();`);
console.table(result); // prints returned time value from server

// Shutdown sql connection pool & connector
await pool.end();

if( connector ) {
  connector.close();
}
