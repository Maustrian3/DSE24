
import dotenv from 'dotenv';
import { FollowingVehicle, LeadingVehicle } from './vehicle.js';
import {Simulator} from "./simulator.js";

dotenv.config();

const sim = new Simulator();
sim.createVehicles(1);
await sim.startVehicles();
await sim.startMockControlService();
await sim.startLVManeuvers();
//sim.stopVehicles();

// const leading= new LeadingVehicle( 48.2303098, 16.4018315, 90, 45 );
// await leading.register();
// await leading.openChannel();
//
// leading.startUpdaterTimer();
//
// const following= new FollowingVehicle( 38.2303098, 16.4018315, 90 , 50 )
// await following.register();
// await following.openChannel();
//
// following.startUpdaterTimer();

//let inside= false;

// Every 7 seconds the following vehicle jumps out of range/into range
// setInterval(() => {
//   following.long= inside ? 48.2303098 : 38.2303098;
//   inside= !inside;
//
// }, 7000);