import { getConnection, releaseConnection } from '../../common/db.js';

export async function getKind( req, res ) {
  const { vin }= req.params;

  let conn;
  try {
    conn= await getConnection();
    const [results]= await conn.execute(
      `SELECT is_leading FROM inventory_vehicles WHERE vin = ?`,
      [ vin ]
    );

    if( results.length < 1 ) {
      res.status(404).send(`Unknown VIN '${vin}'`);
      return;
    }

    res.send({ kind: results[0].is_leading ? 'leading' : 'following' });
  }  finally {
    releaseConnection( conn );
  }
}
