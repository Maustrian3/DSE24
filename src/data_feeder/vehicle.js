import {openWithDirectExchange, openWithDirectExchangeListener, openWithQueue} from "../common/channel.js";

import {ADJECTIVES, NAMES, NOUNS} from "./vehicleNameConstants.js";

import * as turf from '@turf/turf';

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

class Vehicle {
  constructor(long, lat, heading, speed) {
    this.long = long;
    this.lat = lat;
    this.heading = heading;
    this.speed = speed;
    this.lane = 1;

    this.vin = null;
    this.name = null;
    this.oem = null;
    this.model_type = null;
    this.channelId = null;
    this.updateChannel = null;

    this.updateInterval = 2000;
    this.updaterTimer = null;

    this.manualMode = false;

    this.fillWithRandomData();
  }

  fillWithRandomData() {
    this.vin = Date.now().toString().padStart(17, 'a');
    this.name = pickRandom(NAMES) + ' ' + pickRandom(ADJECTIVES) + ' ' + pickRandom(NOUNS);
    this.oem = 'Audi';
    this.model_type = 'SQ8 e-tron';
  }

  vehicleKind() {
    throw Error('Abstract method');
  }

  followMeStatus() {
    throw Error('Abstract method');
  }

  followMeUpdate(content) {
    throw Error('Abstract method');
  }

  async register() {
    const registerData = {
      vin: this.vin,
      name: this.name,
      oem: this.oem,
      model_type: this.model_type,
      kind: this.vehicleKind()
    };

    const response = await fetch(process.env.REGISTER_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(registerData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw Error(`Could not register vehicle (status ${response.status}): ${errorText}`);
    }

    const jsonResponse = await response.json();
    this.channelId = jsonResponse["channel_id"];
    console.log('Registered ', this.vin, ' with channelId:', this.channelId);
  }

  async openChannel() {

    // Channel for updates sent to the Beachcomb service
    this.updateChannel = await openWithQueue(process.env.CHANNEL_VEHICLE_UPDATES);

    // Channel for updates received from the Control service
    this.controlChannel = await openWithDirectExchangeListener(this.channelId);
    this.controlChannel.consume(
      this.channelId + "_queue",
      (msg) => {
        if (msg !== null) {
          const content = JSON.parse(msg.content.toString());
          this.followMeUpdate(content);
        } else {
          console.log("Consumer cancelled by server");
        }
      },
      { noAck: true }
      //vehicleControlUpdateConsumer();
    );
  }

  move() {
    const distanceTravelled = this.speed * (this.updateInterval / 1000 / 60 / 60);
    const newCoord = turf.destination(turf.point([this.long, this.lat]), distanceTravelled, this.heading, {units: 'kilometers'});
    this.long = newCoord.geometry.coordinates[0];
    this.lat = newCoord.geometry.coordinates[1];
  }

  sendUpdate() {
    const msg = {
      time: new Date().toISOString(),
      vin: this.vin,
      location: {
        long: this.long,
        lat: this.lat,
        heading: this.heading
      },
      speed: this.speed,
      lane: this.lane,
      follow_me: this.followMeStatus()
    };

    console.log('Sending: Type:', this.vehicleKind(),
      ' | Location:', msg.location.long, msg.location.lat,
      ' | Speed: ', msg.speed,
      ' | Lane: ', msg.lane,
      ' | FollowME: ', msg.follow_me);

    this.updateChannel.sendToQueue(
      process.env.CHANNEL_VEHICLE_UPDATES,
      Buffer.from(JSON.stringify(msg))
    );
  }

  stopUpdaterTimer() {
    if (this.updaterTimer !== null) {
      clearInterval(this.updaterTimer);
    }
  }

  startUpdaterTimer() {
    this.stopUpdaterTimer();
    this.updaterTimer = setInterval(() => {
      this.move();
      this.sendUpdate();
    }, this.updateInterval);
  }


}

export class LeadingVehicle extends Vehicle {
  constructor(long, lat, heading, speed) {
    super(long, lat, heading, speed);

    this.followerVin = null;
  }

  vehicleKind() {
    return 'leading';
  }

  followMeStatus() {
    if (!this.followerVin) {
      return null;
    }

    // Driving command to the follower vehicle
    // Just send our own speed and lane
    return {
      speed: this.speed,
      lane: this.lane
    };
  }

  // Receive control message from control service
  followMeUpdate(content) {
    //console.log('Lead Control Update: ', content);
    this.followerVin = content.follow_me.VIN;
  }
}

export class FollowingVehicle extends Vehicle {
  constructor(long, lat, heading, speed) {
    super(long, lat, heading, speed);

    this.leadingVin = null;
  }

  vehicleKind() {
    return 'following';
  }

  followMeStatus() {
    return this.leadingVin !== null;
  }

  // Receive control message from control service
  followMeUpdate(content) {
    //console.log('Follow Control Update: ', content);
    if (!this.manualMode) { // Not in manual mode: Follow the leading vehicle
      this.leadingVin = content.follow_me.VIN;
      this.speed = content.follow_me.speed;
      this.lane = content.follow_me.lane;
    }
  }
}

// export function vehicleControlUpdateConsumer(msg) {
//   const content = JSON.parse(msg.content.toString());
//   console.log('Received control update:', content);
//
//
//   // console.log('Received control update:', content);
// }
