import { PromiseMemcached } from '../promiseMemcached.js';
import { sendAvailableVehicles, sendCommand, sendLogMessage } from '../publish.js';
import { waitFor } from '../util.js';

/**
 * @param {PromiseMemcached} memcached 
 * @returns 
 */
export function probingMessage( channel, memcached ) {

  async function endPairing( leadingVIN ) {
    const entry= await memcached.get(`leading-${ leadingVIN }`);
    if( !entry ) {
      console.error('Could not lookup leading entry when ending pairing');
      return;
    }

    const { following, leading }= entry;

    // Remove memcached entries
    await memcached.del(`following-${following.vin}`);
    await memcached.del(`leading-${leading.vin}`);

    // Send end follow_me state to cars
    const endCommand= {
      time: new Date().toISOString(),
      ended: true
    };
    sendCommand(channel, following.channelId, endCommand);
    sendCommand(channel, leading.channelId, endCommand);

    // Send available message to beachcomb
    sendAvailableVehicles(channel, [following.vin, leading.vin], []);
  }

  return async function probingMessageConsumer( msg ) {
    const content= JSON.parse( msg.content.toString() );
    const { startTime, leadingVIN, isStrict } = content;
  
    // TTL of the pairing is over -> end the pairing
    const now= Date.now();
    const timeAlive = now - new Date(startTime).getTime();
    const pairingTTL = parseInt(process.env.PAIRING_TTL_MS);
    if( timeAlive > pairingTTL ) {
      sendLogMessage(channel, {
        time: Date.now(),
        severity: "info",
        message: `Paring ended due to time limit`,
        type: "followMe_timeout",
        data: { leadingVIN }
      });
      await endPairing(leadingVIN);
      return;
    }
  
    let pairingStillActive= false, logMessage= null, willBeStrict= false, cacheEntry= null;

    // Get the memcached entry
    const probingInterval = parseInt(process.env.PROBING_INTERVAL_MS);
    const maxTime= probingInterval * 2;
    await memcached.optimisticLock(`leading-${ leadingVIN }`, maxTime, entry => {
      const { following, leading }= cacheEntry= entry;

      // Check if cars sent message in time frame
      const followingDidTimeout= now - new Date( following.lastUpdate ).getTime() > probingInterval;
      const leadingDidTimeout= now - new Date( leading.lastUpdate ).getTime() > probingInterval;
      if( followingDidTimeout || leadingDidTimeout ) {
        logMessage= {
          time: Date.now(),
          severity: "alarm",
          message: `Paring ended due to ${ followingDidTimeout ? 'following' : 'leading'} vehicle timeout`,
          type: "vehicle_timeout",
          data: { followingDidTimeout, leadingDidTimeout, followingVIN: following.vin, leadingVIN }
        };
        pairingStillActive= false;
        return PromiseMemcached.StopLockAttemptsFlag;
      }

      // FIXME: Do vehicles have enough time from starting the pairing to first send their data?
      // Check if cars are still following/leading state
      if( following.lane === null || following.speed === null || leading.currentCommand === null ) {
        logMessage= {
          time: Date.now(),
          severity: "alarm",
          message: `Paring ended due to vehicle leaving pairing mode`,
          type: "vehicle_left_pairing",
          data: {
            lane: following.lane,
            speed: following.speed,
            command: leading.currentCommand,
            followingVIN: following.vin,
            leadingVIN
          }
        };
        pairingStillActive= false;
        return PromiseMemcached.StopLockAttemptsFlag;
      }

      // Check whether following obeys commands (within tolerances)

      // If follower already obeys current command everything is fine
      const current= leading.currentCommand;
      if( following.lane !== current.lane || following.speed !== current.speed ) {

        // If already strict and doesn't follow current command --> error
        if( isStrict ) {
          logMessage= {
            time: Date.now(),
            severity: "alarm",
            message: `Paring ended due to following vehicle not obeying command within time interval`,
            type: "vehicle_command_not_obeyed",
            data: {
              lane: following.lane,
              speed: following.speed,
              command: leading.currentCommand,
              followingVIN: following.vin,
              leadingVIN
            }
          };
          pairingStillActive= false;
          return PromiseMemcached.StopLockAttemptsFlag;
        }

        // Follower being in-between commands is fine if we are currently not strict
        const last= leading.lastCommand;
        if(
          last && !(
            Math.min(last.lane, current.lane) <= following.lane &&
            following.lane <= Math.max(last.lane, current.lane) &&
            Math.min(last.speed, current.speed) <= following.speed &&
            following.speed <= Math.max(last.speed, current.speed)
          ) 
        ) {
          logMessage = {
            time: Date.now(),
            severity: "alarm",
            message: `Paring ended due to following vehicle is not in transition between commands`,
            type: "vehicle_command_not_transitioning",
            data: {
              lane: following.lane,
              speed: following.speed,
              lastCommand: last,
              currentCommand: current,
              followingVIN: following.vin,
              leadingVIN,
            },
          };
          pairingStillActive = false;
          return PromiseMemcached.StopLockAttemptsFlag;
        }

        // Next probing will be strict
        willBeStrict= true;
      }

      // Shift the current command into last command
      leading.lastCommand= {};
      Object.assign( leading.lastCommand, leading.currentCommand );

      pairingStillActive= true;
      return entry;
    });
  
  
    if( logMessage ) {
      sendLogMessage( channel, logMessage );
    }
  
    if( !pairingStillActive ) {
      await endPairing(leadingVIN);
      return;
    }
    
    
    // Send state to leading vehicle
    if( cacheEntry ) {
      sendCommand(channel, cacheEntry.leading.channelId, {
        time: new Date().toISOString(),
        follow_me: {
          VIN: cacheEntry.following.vin
        }
      });
    }
    
    // Send probing message to delay queue
    await waitFor( probingInterval );

    console.log('Re-Sending probing message');

    channel.sendToQueue(
      process.env.CHANNEL_PAIRING_PROBING,
      Buffer.from(JSON.stringify({
        startTime,
        leadingVIN,
        isStrict: willBeStrict
      }))
    );
  };
}
