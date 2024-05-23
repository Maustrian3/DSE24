
import dotenv from 'dotenv';
import minimist from 'minimist';
import { FollowingVehicle, LeadingVehicle } from './vehicle.js';

dotenv.config();

// Load additional config file
const options= minimist( process.argv.slice(2) );
if( options.config ) {
  if( typeof options.config !== 'string' ) {
    throw new Error('Expected path for --config option');
  }

  dotenv.config({path: options.config, override: true});
}

const leading= new LeadingVehicle( 48.2303098, 16.4018315 );
await leading.register();
await leading.openChannel();

leading.startUpdaterTimer();

const following= new FollowingVehicle( 38.2303098, 16.4018315 )
await following.register();
await following.openChannel();

following.startUpdaterTimer();

let inside= false;
setInterval(() => {
  following.long= inside ? 48.2303098 : 38.2303098;
  inside= !inside;

}, 7000);
