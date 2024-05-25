import { PromiseMemcached } from '../promiseMemcached.js';
import { sendCommand, sendLogMessage } from '../publish.js';
import { reserveFollowingVehicle, reserveLeadingVehicle } from '../query.js';
import { inventoryGetVehicleChannelId } from '../rest.js';
import { waitFor } from '../util.js';

/**
 * @param {PromiseMemcached} memcached 
 * @returns 
 */
export function closeVehiclesMessage( channel, memcached ) {

  return async function closeVehiclesMessageConsumer( msg ) {
    const content= JSON.parse( msg.content.toString() );
    
    const { VIN_follower: followingVIN, VIN_leading: leadingVIN }= content;
    console.log('Close vehicles', content);

    // Try to reserve leading vehicle
    const maxTime= parseInt( process.env.PAIRING_TTL_MS )* 2;
    const followingVehicleAvailable= await reserveFollowingVehicle( memcached, followingVIN, maxTime );
    if( !followingVehicleAvailable ) {
      return;
    }
    
    // Try to reserve the following vehicle
    const pairingEstablished= await reserveLeadingVehicle( memcached, leadingVIN, maxTime );
    if( !pairingEstablished ) {
      // Release the leading vehicle reservation
      await memcached.del(`following-${followingVIN}`);
      return;
    }
    
    console.log('Reserved memcache entries', content);


    let leadingChannelId;
    let followingChannelId;

    try {
      // Get the channel ids from the inventory service
      leadingChannelId= await inventoryGetVehicleChannelId( leadingVIN );
      followingChannelId= await inventoryGetVehicleChannelId( followingVIN );

      console.log('Got channel ids', leadingChannelId, followingChannelId);
      
      // Create memcached entry
      const entry= {
        following: {
          vin: followingVIN,
          lastUpdate: new Date().toISOString(),
          channelId: followingChannelId,
          lane: null,
          speed: null
        },
        leading: {
          vin: leadingVIN,
          lastUpdate: new Date().toISOString(),
          channelId: leadingChannelId,
          lastCommand: null,
          currentCommand: null
        }
      };

      await memcached.set(`leading-${leadingVIN}`, entry, maxTime);
      await memcached.set(`following-${followingVIN}`, { leadingVIN }, maxTime);

      console.log('Inserted memcached data', entry);


    } catch( e ) {
      // Release reservations on error
      await memcached.del(`leading-${leadingVIN}`);
      await memcached.del(`following-${followingVIN}`);

      throw e;
    }

    // Inform the vehicles that they are now paired
    const time= new Date().toISOString();
    sendCommand( channel, leadingChannelId, {
      time,
      follow_me: {
        VIN: followingVIN
      }
    });

    sendCommand( channel, followingChannelId, {
      time,
      follow_me: {
        VIN: leadingVIN,
        speed: null,
        lane: null
      }
    });
    
    // Send not-available message to beachcomb
    channel.sendToQueue(
      process.env.CHANNEL_VEHICLE_AVAILABILITY,
      Buffer.from(JSON.stringify({
        unavailable: [followingVIN, leadingVIN]
      }))
    );

    // Send Message to Eventlog: "FollowMe Modus gestartet"
    sendLogMessage( channel, {
      time: Date.now(),
      severity: 'info',
      message: `FollowMe mode started for leading ${leadingVIN} and following ${followingVIN} vehicles`,
      type: 'follow_me_start',
      data: { followingVIN, leadingVIN }
    });

    // Send probing message to delay queue
    const probingInterval = parseInt(process.env.PROBING_INTERVAL_MS);
    await waitFor( probingInterval );

    console.log('Sending probing message');

    channel.sendToQueue(
      process.env.CHANNEL_PAIRING_PROBING,
      Buffer.from(JSON.stringify({
        time,
        leadingVIN
      }))
    );
  }
}
