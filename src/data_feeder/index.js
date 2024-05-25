
import dotenv from 'dotenv';
import minimist from 'minimist';
import {Simulator} from "./simulator.js";

dotenv.config();

// Load additional config file
const options= minimist( process.argv.slice(2) );
if( options.config ) {
  if( typeof options.config !== 'string' ) {
    throw new Error('Expected path for --config option');
  }

  dotenv.config({path: options.config, override: true});
}

const sim = new Simulator();
sim.createVehicles(1);
await sim.startVehicles();
await sim.startLVManeuvers();
//sim.stopVehicles();
