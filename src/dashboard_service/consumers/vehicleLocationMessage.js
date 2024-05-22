
export function vehicleLocationMessage( sseChannel ) {

  return async function vehicleLocationMessageConsumer( msg ) {
    const msgJson= msg.content.toString();
    const content= JSON.parse( msgJson );

    sseChannel.broadcast( content );
  };
}
