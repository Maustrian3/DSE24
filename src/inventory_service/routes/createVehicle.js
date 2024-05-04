
import joi from 'joi';
import { getConnection } from '../db.js';
import { randomUUID } from 'node:crypto';

function vehicleValidator() {
  return joi.object({
    vin: joi.string().length(17).required(),
    name: joi.string().max(100).required(),
    oem: joi.string().max(30).required(),
    model_type: joi.string().max(30).required(),
    kind: joi.string().valid("leading", "following").required(),
  }).required();
}

export async function createVehicle( req, res ) {
  
  // Validate that the body is a vehicle
  console.log( req.body );
  const {value: vehicle, error}= vehicleValidator().validate( req.body );
  if( error ) {
    res.status( 422 ).send('Invalid vehicle object: '+ error.message);
    return;
  }

  const {vin, name, oem, model_type, kind}= vehicle;
  const isLeading= kind === 'leading';
  const channelId= randomUUID();

  // Try insert new vehicle into the db
  try {
    const conn= await getConnection();
    await conn.execute(
      `INSERT INTO
        inventory_vehicles (vin, name, oem, model_type, is_leading, channel_id)
        VALUES(?, ?, ?, ?, ?, ?)`,
      [vin, name, oem, model_type, isLeading, channelId]
    );

  } catch( e ) {
    if( e.code === 'ER_DUP_ENTRY' ) {
      res.status( 422 ).send('Could not create vehicle: Duplicate VIN');
      return;  
    }

    res.status(500).send('Could not create vehicle');
    return;
  }

  res.send({ channel_id: channelId });
}
