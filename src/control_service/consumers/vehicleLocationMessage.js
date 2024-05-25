import { PromiseMemcached } from "../promiseMemcached.js";

export function vehicleLocationMessage( channel, memcached ) {
 
  return async function vehicleLocationMessageConsumer( msg ) {
    // Unwrap the RabbitMQ packet
    const content= JSON.parse( msg.content.toString() );
    
    const { time, vin, speed, lane, follow_me, kind }= content;
    const isLeading= kind === 'leading';

    // If it is a following VIN, we need to lookup the leading VIN first
    let leadingVIN= vin;
    if( !isLeading ) {
      const entry= await memcached.get(`following-${ vin }`);

      // Following vehicle is currently not paired -> ignore the packet
      if( !entry ) {
        console.log('Following is not paired');
        return;
      }

      leadingVIN= entry.leadingVIN;
    }

    // Update the memcached entry with the leading VIN as key
    const maxTime= parseInt( process.env.PROBING_INTERVAL_MS) * 2;
    let isPaired= false;
    let followingChannelId= null;
    await memcached.optimisticLock(`leading-${ leadingVIN }`, maxTime, entry => {
      // Vehicle is not paired -> ignore the packet
      if( entry === null ) {
        console.log('Leading is not paired');
        return PromiseMemcached.StopLockAttemptsFlag;
      }

      // Skip if a newer update is already in the memcache
      const vehicleEntry= isLeading ? entry.leading : entry.following;
      if( new Date(time) < new Date(vehicleEntry.lastUpdate) ) {
        console.log('Packet is too old');
        return PromiseMemcached.StopLockAttemptsFlag;
      }

      // Update the time in the entry
      vehicleEntry.lastUpdate= time;

      // Update the state of either the following or leading vehicle in the pair
      if( isLeading ) {
        entry.leading.currentCommand= follow_me || null;
        followingChannelId= entry.following.channelId;

      } else {
        if( follow_me ) {
          entry.following.lane= lane;
          entry.following.speed= speed;
        } else {
          entry.following.lane= null;
          entry.following.speed= null;
        }
      }

      console.log( 'Updated entry', entry );

      isPaired= true;
      return entry;
    });

    // Send control command to following vehicle
    if( isPaired && isLeading && follow_me ) {
      console.log('Sending command to following');
      sendCommand( channel, followingChannelId, {
        time: new Date().toISOString(),
        follow_me: {
          VIN: leadingVIN,
          speed: follow_me.speed,
          lane: follow_me.lane
        }
      });
    }
  }
}
