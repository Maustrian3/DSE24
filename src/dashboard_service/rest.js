
export async function beachcombGetVehiclePositions() {
  const response= await fetch(`http://${process.env.BEACHCOMB_HOST}/vehicles/positions`);
      
  if( !response.ok ) {
    const errorText= await response.text();
    console.error(`Could not lookup vehicle positions (status ${response.status}): ${errorText}`);
    return;
  }

  return await response.json();
}

