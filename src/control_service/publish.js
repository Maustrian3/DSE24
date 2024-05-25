
export function sendCommand( channel, vehicleChannelId, data ) {
  channel.publish(
    process.env.CHANNEL_CONTROL_MESSAGES,
    vehicleChannelId,
    Buffer.from( JSON.stringify( data ) )
  );
}

export function sendLogMessage( channel, config ) {
  console.log( config.message );
  
  channel.publish(
    process.env.CHANNEL_LOGS, '',
    Buffer.from( JSON.stringify( config ) )
  );
}

export function sendAvailableVehicles( channel, available, unavailable ) {
  channel.sendToQueue(
    process.env.CHANNEL_VEHICLE_AVAILABILITY,
    Buffer.from(JSON.stringify({ available, unavailable }))
  );
}
