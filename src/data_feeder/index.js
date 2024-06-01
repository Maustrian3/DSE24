
import dotenv from 'dotenv';
import {Simulator} from "./simulator.js";
import { parseParams } from './params.js';

dotenv.config();

const { scenario }= parseParams();

const sim = new Simulator( scenario );
sim.createVehicles();
await sim.startVehicles();
await sim.startLVManeuvers();
//sim.stopVehicles();
