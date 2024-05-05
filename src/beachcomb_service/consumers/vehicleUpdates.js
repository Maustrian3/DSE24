
export function vehicleUpdates( msg ) {
  const content= JSON.parse( msg.content.toString() );
  console.log( content );
}
