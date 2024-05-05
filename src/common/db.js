import mysql from 'mysql2/promise';
import {Connector} from '@google-cloud/cloud-sql-connector';


let pool= null;
let connector= null;
function assertDbInit() {
  if( !pool ) {
    throw Error('Database was not initialized');
  }
}

export async function getConnection() {
  assertDbInit();
  return await pool.getConnection()
}

export async function initDb() {
  // Either load google CloudSQL options or just use values from the .env file
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
  pool = await mysql.createPool({
    ...clientOpts,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
}

export async function shutdownDb() {
  assertDbInit();

  // Shutdown sql connection pool & connector
  await pool.end();

  if( connector ) {
    connector.close();
  }
}

export function releaseConnection( conn ) {
  if( !conn ) {
    return;
  }

  assertDbInit();
  pool.releaseConnection( conn );
}
