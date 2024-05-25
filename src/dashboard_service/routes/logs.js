import { getConnection, releaseConnection } from '../../common/db.js';
import { getLogLines } from '../query.js';

export async function logs(req, res) {
  const from = new Date( parseInt(req.query.from) || 0 );
  const to= new Date( parseInt(req.query.to) || Date.now() );
  
  let conn= null;

  try {
    conn= await getConnection();
    const logLines= await getLogLines(conn, from, to);

    res.send( logLines );

  } finally {
    releaseConnection( conn );
  }
}
