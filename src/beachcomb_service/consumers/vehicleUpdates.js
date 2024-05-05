import joi from 'joi';
import { getConnection, releaseConnection } from '../../common/db.js';

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

async function findCloseAvailableLeadingVehicles( conn, vin ) {
  const distance= 200;

  const [results]= await conn.execute(
    `SELECT vin FROM beachcomb_vehicles WHERE
      vin <> ? AND
      is_available = 1 AND
      is_leading = 1 AND
      TIMESTAMPDIFF(SECOND, last_distance_check, ?) < 600 AND
      ST_DISTANCE_SPHERE(position, (SELECT position FROM beachcomb_vehicles WHERE vin = ?)) <= ?`,
    [vin, new Date(), vin, distance]
  );

  // TODO: Send close vehicles to control service
  console.log('Found close vins:', results)
}


export async function vehicleUpdates( msg ) {
  const content= JSON.parse( msg.content.toString() );
  const {value: update, error}= vehicleUpdateValidator().validate( content );
  if( error ) {
    console.error('Bad vehicle update:', error);
    return;
  }

  const { vin, location: {long, lat, heading}, follow_me }= update;
  const isAvailable= !follow_me;

  // TODO: Re-Send data to status channel

  let conn;
  try {
    conn= await getConnection();

    const [results]= await conn.execute(
      `select last_distance_check, is_available, is_leading from beachcomb_vehicles where vin= ?`,
      [vin]
    );

    // Insert new line and do distance check if vin doesn't exist
    if( !results.length ) {
      const response= await fetch(`http://${process.env.INVENTORY_HOST}/vehicles/${vin}/kind`);
      
      if( !response.ok ) {
        const errorText= await response.text();
        console.error(`Could not lookup vehicle kind for '${vin}' (status ${response.status}): ${errorText}`);
        return;
      }

      const { kind }= await response.json();
      const isLeading= kind === 'leading';

      const [insertResult]= await conn.execute(
        `insert into beachcomb_vehicles
        (vin, is_leading, is_available, position, last_distance_check)
        values(?, ?, ?, POINT(?, ?), ?);`,
        [vin, isLeading, isAvailable, long, lat, new Date()]
      );

      console.log('Inserted vehicle', vin, isLeading, isAvailable, long, lat)

      if (insertResult.affectedRows < 1 ) {
        console.error('Could not create vehicle record');
        return;
      }

      // Do distance check immediately
      if( !isLeading && isAvailable ) {
        await findCloseAvailableLeadingVehicles( conn, vin );
      }

      return;
    }

    if( isAvailable !== !!results[0].is_available ) {
      console.warn('Available fields do not match');
    }

    
    // Check if we need to do a distance check now
    const {
      last_distance_check: last_distance_check_unadjusted,
      is_available,
      is_leading
    }= results[0];
    const currentTime= new Date();
    const lastDistanceCheck= new Date( last_distance_check_unadjusted.getTime() + currentTime.getTimezoneOffset() * 60* 1000 );
    const doDistanceCheck= (currentTime - lastDistanceCheck) > 5000 && is_available && !is_leading;

    console.log( 'Do distance check?', currentTime, lastDistanceCheck, (currentTime - lastDistanceCheck), is_available, !is_leading );
    
    // Update position of the vehicle
    const [updateResult]= await conn.execute(
      `update beachcomb_vehicles set
        position= POINT(?, ?), last_distance_check= ?
        where vin= ?`,
        [long, lat, doDistanceCheck ? currentTime : lastDistanceCheck, vin]
    );

    console.log('Updated vehicle', long, lat, doDistanceCheck ? currentTime : lastDistanceCheck, vin, doDistanceCheck);

    if( updateResult.affectedRows < 1 ) {
      console.error('Could not update vehicle record');
      return;
    }
    
    if( doDistanceCheck ) {
      await findCloseAvailableLeadingVehicles( conn, vin );
    }

  } catch( e ) {
    console.error('Could not process vehicle update message:', e);

  } finally {
    releaseConnection( conn );
  }
}
