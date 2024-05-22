import { beachcombGetVehiclePositions } from '../rest.js';

export async function vehicles( req, res ) {
  const vehicles= await beachcombGetVehiclePositions();
  res.send( vehicles );
}
