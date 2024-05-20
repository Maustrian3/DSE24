import mysql from 'mysql2/promise';

let pool= null;
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
  // Create connection pool
  pool = await mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
}

export async function shutdownDb() {
  assertDbInit();

  // Shutdown sql connection pool & connector
  await pool.end();
}

export function releaseConnection( conn ) {
  if( !conn ) {
    return;
  }

  assertDbInit();
  pool.releaseConnection( conn );
}
