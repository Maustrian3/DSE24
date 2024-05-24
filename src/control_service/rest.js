

export async function inventoryGetVehicleChannelId( vin ) {
  const response= await fetch(`http://${process.env.INVENTORY_HOST}/vehicles/${vin}/channel`);
      
  if( !response.ok ) {
    const errorText= await response.text();
    console.error(`Could not lookup vehicle channel id for '${vin}' (status ${response.status}): ${errorText}`);
    return;
  }

  const { channel_id }= await response.json();
  return channel_id;
}

