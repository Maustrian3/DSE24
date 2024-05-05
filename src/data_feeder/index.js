
import dotenv from 'dotenv';
import { LeadingVehicle } from './vehicle.js';

dotenv.config();

const leading= new LeadingVehicle( 48.2303098, 16.4018315 );
await leading.register();
await leading.openChannel();

leading.startUpdaterTimer();

