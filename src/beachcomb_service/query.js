
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
        (vin, is_leading, is_available, position, last_distance_check)
        values(?, ?, ?, POINT(?, ?), ?);`,
    [vin, isLeading, isAvailable, long, lat, new Date()]
  );

  return insertResult;
}

export async function updateVehiclePosition( conn, long, lat, checkTime, vin) {
  const [updateResult] = await conn.execute(
    `update beachcomb_vehicles set
        position= POINT(?, ?), last_distance_check= ?
        where vin= ?`,
    [long, lat, checkTime, vin]
  );
  
  return updateResult;
}

export async function getCloseVehicles( conn, vin, distance= 200 ) {
  const [results] = await conn.execute(
    `SELECT vin FROM beachcomb_vehicles WHERE
      vin <> ? AND
      is_available = 1 AND
      is_leading = 1 AND
      TIMESTAMPDIFF(SECOND, last_distance_check, ?) < 600 AND
      ST_DISTANCE_SPHERE(position, (SELECT position FROM beachcomb_vehicles WHERE vin = ?)) <= ?`,
    [vin, new Date(), vin, distance]
  );
  
  return results;
}
