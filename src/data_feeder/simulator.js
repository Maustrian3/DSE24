import {FollowingVehicle, LeadingVehicle} from "./vehicle.js";

import * as turf from '@turf/turf';

export class Simulator {
  constructor() {
    this.leadingVehicle = null;
    this.followingVehicle = null;
  }

  createVehicles() {
    
    let long = 44.55984;
    let lat = -98.98901;
    const distanceBetweenVehicles = 0.3; //  in km
    const heading = 90; // 90 degrees = east

    this.leadingVehicle = new LeadingVehicle(long, lat, heading, 40);

    let nextCoord = turf.destination(
      turf.point([long, lat]),
      distanceBetweenVehicles,
      -heading,
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
    while (!this.followingVehicle.followMeStatus()) {
      await sleep(1000);
    }
    this.leadingVehicle.lane = this.leadingVehicle.lane === 1 ? 2 : 1;
    await sleep(5000);
    this.leadingVehicle.speed = this.leadingVehicle.speed += 20;
    await sleep(5000);
    this.leadingVehicle.lane = this.leadingVehicle.lane === 1 ? 2 : 1;
    await sleep(5000);
    
    // Test that following vehicle suddenly no longer obeys the command
    // this.followingVehicle.manualMode = true;
    
    // Test vehicle no longer sends location updates to backend
    // this.followingVehicle.stopUpdaterTimer();
    
    // Test following vehicle suddenly stops followMe itself
    // this.followingVehicle.stopFollowMe();
    // this.followingVehicle.manualMode = true;
    
    // Test leading vehicle suddenly stops followMe itself
    //this.leadingVehicle.stopFollowMe();
    //this.leadingVehicle.manualMode = true;

    this.leadingVehicle.speed = this.leadingVehicle.speed += 20;
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
