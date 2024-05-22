import { getConnection, releaseConnection } from "../../common/db.js";
import { getActiveVehiclePositions } from "../query.js";

export async function vehiclePositions( req, res ) {

  let conn;
  try {
    conn= await getConnection();
    const vehicles= await getActiveVehiclePositions( conn );
    
    res.send( vehicles.map( vehicle => ({
      vin: vehicle.vin,
      location: {
        long: vehicle.longitude,
        lat: vehicle.latitude,
        heading: null
      },
      kind: vehicle.is_leading ? 'leading' : 'following'
    }) ) );

  } finally {
    releaseConnection( conn );
  }
}
