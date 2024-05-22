
export async function insertLogLine( conn, time, severity, message, type, data ) {
  const [insertResults]= await conn.execute(
    `insert into dashboard_logs 
      (time, severity, message, type, data)
      values(?, ?, ?, ?, ?)`,
    [time, severity, message, type, JSON.stringify(data) ]
  );

  return insertResults;
}

export async function getLogLines( conn, from, to ) {
  const [results]= await conn.execute(
    `select * from dashboard_logs 
      where ? <= time and time <= ?
      order by time desc`,
    [from, to]
  );

  // Convert stored JSON data string back to object
  results.forEach( row => {
    try {
      row.data= JSON.parse(row.data);
    } catch(e) {
      console.error(`Could not parse log message data from db: ${row.data}`, e)
      row.data= null;
    }
  });

  return results;
}
