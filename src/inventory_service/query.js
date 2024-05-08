
export async function insertNewVehicle(conn, vin, name, oem, model_type, isLeading, channelId) {
  const [insertResults]= await conn.execute(
    `INSERT INTO
      inventory_vehicles (vin, name, oem, model_type, is_leading, channel_id)
      VALUES(?, ?, ?, ?, ?, ?)`,
    [vin, name, oem, model_type, isLeading, channelId]
  );

  return insertResults;
}

export async function getVehicleChannelId( conn, vin )  {
  const [results] = await conn.execute(
    `SELECT channel_id FROM inventory_vehicles WHERE vin = ?`,
    [vin]
  );

  return results;
}


export async function getVehicleKind( conn, vin )  {
  const [results] = await conn.execute(
    `SELECT is_leading FROM inventory_vehicles WHERE vin = ?`,
    [vin]
  );

  return results;
}
