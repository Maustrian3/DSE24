
import dotenv from 'dotenv';
import { FollowingVehicle, LeadingVehicle } from './vehicle.js';

dotenv.config();

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
