
export async function getVehicleForUpdate( conn, vin ) {
  const [results]= await conn.execute(
    `select last_distance_check, is_available, is_leading from beachcomb_vehicles where vin= ?`,
    [vin]
  );

  return results;
}

export async function insertNewVehicle( conn, vin, isLeading, isAvailable, long, lat ) {
  const [insertResult] = await conn.execute(
    `insert into beachcomb_vehicles
        (vin, is_leading, is_available, position, last_distance_check, last_update)
        values(?, ?, ?, POINT(?, ?), ?, ?);`,
    [vin, isLeading, isAvailable, long, lat, new Date(), new Date()]
  );

  return insertResult;
}

export async function updateVehiclePosition( conn, long, lat, checkTime, vin) {
  const [updateResult] = await conn.execute(
    `update beachcomb_vehicles set
        position= POINT(?, ?), last_distance_check= ?, last_update= ?
        where vin= ?`,
    [long, lat, checkTime, new Date(), vin]
  );
  
  return updateResult;
}

export async function getCloseVehicles( conn, vin, distance= 200 ) {
  const [results] = await conn.execute(
    `SELECT vin FROM beachcomb_vehicles WHERE
      vin <> ? AND
      is_available = 1 AND
      is_leading = 1 AND
      TIMESTAMPDIFF(SECOND, last_update, ?) < 60 AND
      ST_DISTANCE_SPHERE(position, (SELECT position FROM beachcomb_vehicles WHERE vin = ?)) <= ?`,
    [vin, new Date(), vin, distance]
  );
  
  return results;
}

export async function getActiveVehiclePositions( conn ) {
  const [results]= await conn.execute(
    `select vin, ST_X(position) as longitude, ST_Y(position) as latitude, is_leading
    from beachcomb_vehicles where TIMESTAMPDIFF(SECOND, last_update, ?) < 60`,
    [new Date()]
  );

  return results;
}

export async function updateVehicleAvailability( conn, vins, availability ) {
  const [updateResult] = await conn.execute(
    `update beachcomb_vehicles set
        is_available= ?
        where vin in (${ '?,'.repeat( vins.length ).slice(0, -1) })`,
    [availability, ...vins]
  );
  
  return updateResult;
}
