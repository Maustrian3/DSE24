import {openWithDirectExchangeListener, openWithQueue} from "../common/channel.js";

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
    this.messageChannel = null;

    this.updateInterval = 2000;
    this.updaterTimer = null;

    this.manualMode = false;

    this.fillWithRandomData();
  }

  fillWithRandomData() {
    this.vin = Math.floor(Math.random() * 10e12).toString().padStart(17, 'a');
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
    this.messageChannel = await openWithQueue(process.env.CHANNEL_VEHICLE_UPDATES);

    // Channel for updates received from the Control service
    const controlQueue = await openWithDirectExchangeListener(
      process.env.CHANNEL_CONTROL_MESSAGES,
      this.channelId
    );
    this.messageChannel.consume( controlQueue.queue, msg => {
        if( !msg ) {
          console.error('Consumer cancelled by server');
          return;
        }

        const content = JSON.parse( msg.content.toString() );
        console.log('Control message received', content);

        this.followMeUpdate(content);
      },
      { noAck: true }
    );
  }

  move() {
    const distanceTravelled = this.speed * (this.updateInterval / 1000 / 60 / 60);
    const location = turf.point([this.long, this.lat]);
    const newCoord = turf.destination(location, distanceTravelled, this.heading, {units: 'kilometers'});
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
      ' | FollowMe: ', msg.follow_me);

    this.messageChannel.sendToQueue(
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

  stopFollowMe() {
    this.followerVin= null;
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
    if( !content.follow_me || content.ended ) {
      console.log('Detached leading vehicle');
      this.followerVin= null;
      return;
    }

    if( !this.manualMode ) {
      this.followerVin = content.follow_me.VIN;
    }
  }
}

export class FollowingVehicle extends Vehicle {
  constructor(long, lat, heading, speed) {
    super(long, lat, heading, speed);

    this.leadingVin = null;
  }

  stopFollowMe() {
    this.leadingVin= null;
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

      if( !content.follow_me || content.ended ) {
        console.log('Detached following vehicle');
        this.leadingVin= null;
        return;
      }

      const {VIN, speed, lane }= content.follow_me;
      this.leadingVin = VIN;

      if( speed !== null && lane !== null ) {
        this.speed = speed;
        this.lane = lane;
      }
    }
  }
}
