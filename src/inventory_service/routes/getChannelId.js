import { getConnection, releaseConnection } from '../../common/db.js';
import { getVehicleChannelId } from '../query.js';

export async function getChannelId( req, res ) {
  const { vin }= req.params;

  let conn;
  try {
    conn= await getConnection();
    
    const results = await getVehicleChannelId(conn, vin);

    if( results.length < 1 ) {
      res.status(404).send(`Unknown VIN '${vin}'`);
      return;
    }

    res.send( results[0] );
  }  finally {
    releaseConnection( conn );
  }
}
