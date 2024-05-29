import {FollowingVehicle, LeadingVehicle} from "./vehicle.js";

import * as turf from '@turf/turf';

export class Simulator {
  constructor( scenario ) {
    this.leadingVehicle = null;
    this.followingVehicle = null;
    this.scenario= scenario;
  }

  createVehicles() {
    
    let long = -98.98901;
    let lat = 44.55984;
    const distanceBetweenVehicles = 0.3; //  in km
    const heading = 0; // 0 degrees = north

    this.leadingVehicle = new LeadingVehicle(long, lat, heading, 40);

    // Place the following vehicle behind the leading one
    let nextCoord = turf.destination(
      turf.point([long, lat]),
      distanceBetweenVehicles,
      heading - 180,
      { units: "kilometers" }
    );

    this.followingVehicle = new FollowingVehicle(
      nextCoord.geometry.coordinates[0],
      nextCoord.geometry.coordinates[1],
      heading,
      55
    );
  }

  async startVehicles() {
      await this.leadingVehicle.register();
      await this.followingVehicle.register();
      await this.leadingVehicle.openChannel();
      await this.followingVehicle.openChannel();
      this.leadingVehicle.startUpdaterTimer();
      this.followingVehicle.startUpdaterTimer();
  }

  async startLVManeuvers() {
    // Standard follow me pairing setup: Let the following vehicle catch up
    // to the leading one and wait until pairing complete
    while (!this.followingVehicle.followMeStatus()) {
      await sleep(1000);
    }

    // Perform the maneuvers
    this.leadingVehicle.lane = this.leadingVehicle.lane === 1 ? 2 : 1;
    await sleep(5000);
    this.leadingVehicle.speed = this.leadingVehicle.speed += 20;
    await sleep(5000);
    this.leadingVehicle.lane = this.leadingVehicle.lane === 1 ? 2 : 1;
    await sleep(5000);
    this.leadingVehicle.speed = this.leadingVehicle.speed += 20;
    await sleep(5000);
    
    // Run the selected scenario
    await this.scenario();
  }

  stopVehicles() {
    this.leadingVehicle.speed = 0;
    this.followingVehicle.speed = 0;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
