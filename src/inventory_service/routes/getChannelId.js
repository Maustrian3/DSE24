import { getConnection } from '../../common/db.js';

export async function getChannelId( req, res ) {
  const { vin }= req.params;

  const conn= await getConnection();
  const [results]= await conn.execute(
    `SELECT channel_id FROM inventory_vehicles WHERE vin = ?`,
    [ vin ]
  );

  if( results.length < 1 ) {
    res.status(404).send(`Unknown VIN '${vin}'`);
    return;
  }

  res.send( results[0] );
}
