import joi from 'joi';
import { getConnection, releaseConnection } from '../../common/db.js';
import {
  getVehicleForUpdate,
  insertNewVehicle,
  updateVehiclePosition,
  getCloseVehicles
} from '../query.js';
import { inventoryGetVehicleKind } from '../rest.js';

function vehicleUpdateValidator() {
  return joi.object({
    time: joi.string().isoDate().required(),
    vin: joi.string().length(17).required(),
    location: joi.object({
      long: joi.number().required(),
      lat:  joi.number().required(),
      heading: joi.number().required()
    }).unknown(false).required(),
    speed: joi.number().min(0).required(),
    lane: joi.number().integer().min(1).max(3).required(),
    follow_me: joi.alternatives().try(
      joi.boolean(),
      joi.object({
        speed: joi.number().min(0).required(),
        lane: joi.number().integer().min(1).max(3).required()
      }).unknown( false ).allow(null)
    ).required()
  }).unknown(false).required();
}

async function findCloseAvailableLeadingVehicles( conn, followerVin ) {
  const results = await getCloseVehicles(conn, followerVin);

  for( const { vin: leadingVin } of results ) {
    channel.sendToQueue(
      process.env.CHANNEL_CLOSE_VEHICLES,
      Buffer.from( JSON.stringify({
        VIN_follower: followerVin,
        VIN_leading: leadingVin
      }) )
    );
  }
}

async function addNewVehicle(conn, vin, isAvailable, long, lat ) {
  const kind= await inventoryGetVehicleKind( vin );
  const isLeading= kind === 'leading';

  const insertResult = await insertNewVehicle(
    conn, vin, isLeading, isAvailable, long, lat
  );

  if (insertResult.affectedRows < 1 ) {
    console.error('Could not create vehicle record');
    return;
  }

  console.log(`Inserted vehicle '${vin}':`, isLeading, isAvailable, long, lat)

  // Do distance check immediately
  if( !isLeading && isAvailable ) {
    await findCloseAvailableLeadingVehicles( conn, vin );
  }
}

async function updateVehicle(conn, vin, isAvailable, long, lat, results) {
  const {
    last_distance_check: last_distance_check_unadjusted,
    is_available,
    is_leading
  }= results[0];

  if( isAvailable !== !!is_available ) {
    console.warn('Available fields do not match');
  }

  // Check if we need to do a distance check now
  const currentTime= new Date();
  const lastDistanceCheck= new Date( last_distance_check_unadjusted.getTime() + currentTime.getTimezoneOffset() * 60* 1000 );
  const doDistanceCheck= (currentTime - lastDistanceCheck) > 5000 && is_available && !is_leading;
  
  // Update position of the vehicle
  const updateResult = await updateVehiclePosition(
    conn, long, lat, doDistanceCheck ? currentTime : lastDistanceCheck, vin
  );
  
  if( updateResult.affectedRows < 1 ) {
    console.error('Could not update vehicle record');
    return;
  }
  
  console.log(`Updated vehicle '${vin}' at ${long}, ${lat}`);

  if( doDistanceCheck ) {
    await findCloseAvailableLeadingVehicles( conn, vin );
  }
}

async function vehicleUpdateConsumer( msg ) {
  const content= JSON.parse( msg.content.toString() );
  const {value: update, error}= vehicleUpdateValidator().validate( content );
  if( error ) {
    console.error('Bad vehicle update:', error);
    return;
  }

  const { vin, location: {long, lat, heading}, follow_me }= update;
  const isAvailable= !follow_me;

  // Send the validated vehicle update to the rest of the system
  channel.sendToQueue(
    process.env.CHANNEL_VEHICLE_LOCATIONS,
    Buffer.from( JSON.stringify( update ) )
  );

  let conn;
  try {
    conn= await getConnection();

    const results = await getVehicleForUpdate(conn, vin);

    // Insert new line and do distance check if vin doesn't exist
    if( !results.length ) {
      await addNewVehicle(conn, vin, isAvailable, long, lat);
      return;
    }
    
    await updateVehicle(conn, vin, isAvailable, long, lat, results);

  } catch( e ) {
    console.error('Could not process vehicle update message:', e);

  } finally {
    releaseConnection( conn );
  }
}


let channel= null;
export function vehicleUpdates( messageChannel ) {
  channel= messageChannel;

  return vehicleUpdateConsumer;
}
