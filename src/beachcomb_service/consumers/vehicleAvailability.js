import { getConnection, releaseConnection } from "../../common/db.js";
import { updateVehicleAvailability } from "../query.js";

export async function vehicleAvailability( msg ) {
  const content= JSON.parse( msg.content.toString() );
  const { available, unavailable }= content;

  let conn;
  try {
    conn= await getConnection();

    if( available && available.length ) {
      const updateResult = await updateVehicleAvailability( conn, available, true );
      if( updateResult.affectedRows < available.length ) {
        console.error('Could not set availability for ', available);
      }
    }

    if( unavailable && unavailable.length ) {
      const updateResult = await updateVehicleAvailability( conn, unavailable, false );
      if( updateResult.affectedRows < unavailable.length ) {
        console.error('Could not set availability for ', unavailable);
      }
    }
  } finally {
    releaseConnection( conn );
  }
}
