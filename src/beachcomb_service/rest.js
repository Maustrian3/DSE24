
export async function inventoryGetVehicleKind( vin ) {
  const response= await fetch(`http://${process.env.INVENTORY_HOST}/vehicles/${vin}/kind`);
      
  if( !response.ok ) {
    const errorText= await response.text();
    console.error(`Could not lookup vehicle kind for '${vin}' (status ${response.status}): ${errorText}`);
    return;
  }

  const { kind }= await response.json();
  return kind;
}
