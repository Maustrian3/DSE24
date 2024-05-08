
import joi from 'joi';
import { getConnection, releaseConnection } from '../../common/db.js';
import { randomUUID } from 'node:crypto';
import { insertNewVehicle } from '../query.js';

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
  let conn;
  try {
    conn= await getConnection();
    
    const insertResults= await insertNewVehicle(
      conn, vin, name, oem, model_type, isLeading, channelId
    );
    
    if( insertResults.affectedRows < 1) {
      throw Error('Could not insert');
    }

  } catch( e ) {
    if( e.code === 'ER_DUP_ENTRY' ) {
      res.status( 422 ).send('Could not create vehicle: Duplicate VIN');
      return;  
    }

    console.error('Could not insert:', e );

    res.status(500).send('Could not create vehicle');
    return;
  } finally {
    releaseConnection( conn );
  }

  res.send({ channel_id: channelId });
}
