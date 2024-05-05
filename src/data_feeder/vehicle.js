import amqplib from 'amqplib';

const NAMES= [
  'Sepps',
  'Brettls',
  'Bastis',
  'Torlos',
  'Motomotos',
  'Keks',
  'Chrusis',
  'Frozys',
  'Vankeks'
];

const ADJECTIVES= [
  'schnelles',
  'großes',
  'brachiales',
  'rostiges',
  'rotes',
  'blaues',
  'verdelltes',
  'teures',
  'altes',
  'kaputtes',
  'hinniges',
  'klappriges'
];

const NOUNS= [
  'Auto',
  'Kraxn',
  'Vehikel',
  'Automobil',
  'Fahrzeug',
  'Gefaehrt',
  'Fortbewegungsmittel',
  'Zweiachser',
  'Klapperkiste',
  'Schnitzel',
  'Blitz',
  'Fabio'
]

function pickRandom( array ) {
  return array[ Math.floor(Math.random()* array.length) ];
}

class Vehicle {
  constructor(long, lat) {
    this.long= long;
    this.lat= lat;
    this.speed= 0;
    this.lane= 1;

    this.vin= null;
    this.name= null;
    this.oem= null;
    this.model_type= null;
    this.channelId= null;
    this.updateChannel= null;

    this.updaterTimer= null;

    this.fillWithRandomData();
  }

  fillWithRandomData() {
    this.vin= Date.now().toString().padStart( 17, 'a');
    this.name= pickRandom(NAMES)+ ' '+ pickRandom(ADJECTIVES)+ ' '+ pickRandom(NOUNS);
    this.oem= 'Audi';
    this.model_type= 'SQ8 e-tron';
  }

  vehicleKind() { throw Error('Abstract method'); }
  followMeStatus() { throw Error('Abstract method'); }

  async register() {
    const registerData= {
      vin: this.vin,
      name: this.name,
      oem: this.oem,
      model_type: this.model_type,
      kind: this.vehicleKind()
    };

    const response= await fetch( process.env.REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( registerData )
    });
    
    if( !response.ok ) {
      const errorText= await response.text();
      throw Error(`Could not register vehicle (status ${response.status}): ${errorText}`);
    }

    const { channelId }= await response.json();
    this.channelId= channelId;
  }

  async openChannel() {
    const connection= await amqplib.connect( 'amqp://' + process.env.MQ_HOST_PORT );
    this.updateChannel= await connection.createChannel();
    
    this.updateChannel.assertQueue( process.env.CHANNEL_VEHICLE_UPDATES, {
      durable: false
    });
    
    // TODO: Open direct exchange channel with own channelId
  }

  sendUpdate() {
    const msg= {
      time: new Date().toISOString(),
      vin: this.vin,
      location: {
        long: this.long,
        lat: this.lat,
        heading: null
      },
      speed: this.speed,
      lane: this.lane,
      follow_me: this.followMeStatus()
    };

    this.updateChannel.sendToQueue(
      process.env.CHANNEL_VEHICLE_UPDATES,
      Buffer.from( JSON.stringify( msg ) )
    );
  }

  stopUpdaterTimer() {
    if( this.updaterTimer !== null ) {
      clearInterval( this.updaterTimer );
    }
  }

  startUpdaterTimer() {
    this.stopUpdaterTimer();
    this.updaterTimer= setInterval(() => this.sendUpdate(), 2000 );
  }
}

export class LeadingVehicle extends Vehicle {
  constructor(long, lat) {
    super(long, lat);

    this.followerVin= null;
  }

  vehicleKind() {
    return 'leading';
  }

  followMeStatus() {
    if( !this.followerVin ) {
      return null;
    }

    // Driving command to the follower vehicle
    // Just send our own speed and lane
    return {
      speed: this.speed,
      lane: this.lane
    };
  }
}

export class FollowingVehicle extends Vehicle {
  constructor(long, lat) {
    super(long, lat);

    this.leadingVin= null;
  }

  vehicleKind() {
    return 'following';
  }


  followMeStatus() {
    return this.leadingVin !== null;
  }
}
