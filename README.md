# DSE24

<p align="center">
  <img width="400" src="./assets/logo.png">
</p>

## GKE Scripts

The typical processes of starting, stopping, deploying and cleaning-up of services is handled
with a bunch of automated scripts.

#### Starting

First start the cluster and database, then deploy the services.

```bash
sh ./gke-start.sh
sh ./gke-deploy.sh
```

The deploy script pulls the current version from the main branch, and deploys the according images
from docker hub. You can disable GitHub pulling with the option `-nogit`. Docker images are tagged
with the current commit hash by the CI pipeline, to circumvent the GKE image cache, so pulling before
is important and hence automated.

```bash
sh ./gke-deploy.sh -nogit
```

#### Datafeeder testing

After starting and deploying you can also run the data feeders from within the GKE cluster by running
the following script:

```bash
sh ./gke-data-feeder.sh
```

The script automatically removes any active instances of the data feeder on startup and waits for the
services to be ready/healthy. Therefore, you can run it immediately after deploying the services, and
you can re-run it to start the pre-programmed scenario again and again without having to delete the
services manually.

Running a different scenario than the default one set in the image (scenario 'followingVehicleDisobeys') you need to run the data feeder service locally. See the data feeder ReadMe for this.

#### Stopping

If you want to re-deploy the services you need to clean the currently running ones first, and then deploy the new ones. Be aware, that the services actually have to shutdown before re-deploying, so
before running the second command make sure that everything is off.

```bash
sh ./gke-clean.sh
sh ./gke-deploy.sh
```

When you want to shutdown everything including the whole cluster runt the following:

```bash
sh ./gke-stop.sh
```

This command also calls the `gke-clean` script internally so you do not need to clean manually beforehand. Also make sure that all things shutdown properly to avoid unnecessary GKE costs.

## Sequence charts

### Establish/Break link
```mermaid
sequenceDiagram
  participant Follower
  participant Leading
  participant Dashboard as Dashboard Service
  participant REST as REST Gateway
  participant Inventory as Inventory Service
  participant Beachcomb as Beachcomb Service
  participant Control as Control Service
  critical Establish link
    Leading ->> Beachcomb: Message: current data
    Follower ->> Beachcomb: Message: current data
    Beachcomb ->> Control: Message: found close vehicles

    Control ->>+ Inventory: GET /vehicles/<vin>/channel
    Inventory ->>- Control: channel_id
    
    Control ->> Leading: Message: now leading
    Control ->> Follower: Message: now following
    
    Leading ->> Beachcomb: Message: current data (status leading)
    Beachcomb ->> Control: Message: leading is now leading
    Follower ->> Beachcomb: Message: current data (status following)
    Beachcomb ->> Control: Message: following is now following

    Control ->> Beachcomb: Message: vehicles not available
    Control ->> Dashboard: Message: log link established
  end
  par Update state
    Leading ->> Beachcomb: Message: current data
    Follower ->> Beachcomb: Message: current data
    Beachcomb ->> Control: Message: vehicle state 
  end
  critical Break link
    Leading ->> Beachcomb: Message: current dat
    Beachcomb ->> Control: Message: vehicle state

    Follower ->> Beachcomb: Message: current data
    Beachcomb ->> Control: Message: vehicle state
 
    Control ->> Leading: stop leading
    Control ->> Follower: stop following

    Control ->> Beachcomb: Message: vehicles available
    Control ->> Dashboard: Message: log alarm / log timed end
  end
```

### Register vehicle

```mermaid
sequenceDiagram
  participant Follower
  participant Leading
  participant Dashboard as Dashboard Service
  participant REST as REST Gateway
  participant Inventory as Inventory Service
  participant Beachcomb as Beachcomb Service
  participant Control as Control Service
  Leading ->>+ REST: POST /vehicles
  REST ->>+ Inventory: POST /vehicles
  Inventory ->>- REST: channel_id
  REST ->>- Leading: channel_id
  Follower ->>+ REST: POST /vehicles
  REST ->>+ Inventory: POST /vehicles
  Inventory ->>- REST: channel_id
  REST ->>- Follower: channel_id
```

### Connect dashboard to SSE streams
```mermaid
sequenceDiagram
  participant Browser
  participant Follower
  participant Leading
  participant Dashboard as Dashboard Service
  participant REST as REST Gateway
  participant Inventory as Inventory Service
  participant Beachcomb as Beachcomb Service
  participant Control as Control Service
  Browser ->>+ Dashboard: GET /index.html
  Dashboard ->>- Browser: <html>
  Browser ->>+ Dashboard: GET /assets/<script>.js
  Dashboard ->>- Browser: <script>
  par Connect to log file SSE stream
    Browser ->>+ Dashboard: GET /logs?from=..&to=..
    Dashboard ->>- Browser: <logs>

    Browser ->> Dashboard: GET /logs/live
    Dashboard ->> Browser: <SSE stream>

    activate Control
    note right of Control: Log event
    Control ->> Dashboard: Message: <log message>
    Dashboard ->> Browser: SSE: <log message>

  and Connect to map data SSE stream
    Browser ->>+ Dashboard: GET /map
    Dashboard ->>- Browser: <map>

    Browser ->>+ Dashboard: GET /vehicles
    Dashboard ->>+ REST: GET /vehicles/positions
    REST ->>+ Beachcomb: GET /vehicles/positions
    Beachcomb ->>- REST: <vehicles>
    REST ->>- Dashboard: <vehicles>
    Dashboard ->>- Browser: <vehicles>

    Browser ->> Dashboard: GET /vehicles/live
    Dashboard ->> Browser: <SSE stream>

    activate Follower
    note left of Follower: Vehicle moved

    Follower ->> Beachcomb: Message: current data
    Beachcomb ->> Dashboard: Message: vehicle state
    Dashboard ->> Browser: SSE: <vehicle position>
  end
```

## Endpoints

### Gateway
#### POST `/vehicles` proxy
Calls to inventory service POST `/vehicles`.
For parameter descriptions see the [inventory service](#post-vehicles).

#### GET `/vehicles/positions` proxy
Calls to beachcomb service GET `/vehicles`.
For parameter descriptions see the [beachcomb service](#get-vehiclespositions).



### Inventory Service
#### POST `/vehicles`
Creates a new vehicle in the database and makes a new unique channel id.

The JSON body of a new vehicle contains:
```json
{
  "name": "...",
  "VIN": "...",
  "OEM": "...",
  "model_type": "...",
  "kind": "leading"
}
```

- The `VIN` (vehicle identification number) field is a 17 character string uniquely identifying the vehicle.
- The `kind` field describes whether the vehicle is leading or following and can be either `leading` or `following`.

The JSON body of the response on success:
```json
{
  "channel_id": "..."
}
```

- The `channel_id` field is a 36 character UUID v4 string.

#### GET `/vehicles/<vin>/channel`
Gets the channel id for a vehicle by its id.

The JSON response:
```json
{
  "channel_id": "..."
}
```

#### GET `/vehicles/<vin>/kind`
Gets the kind of a vehicle by its id.

The JSON response:
```json
{
  "kind": "leading"
}
```

- The `kind` field is either `leading` or `following`.


### Beachcomb Service
#### GET `/vehicles/positions`
Gets the current positions of all vehicles.

The JSON response:
```json
[
  {
    "VIN": "...",
    "location": {
      "long": 123,
      "lat": 123,
      "heading": 123
    },
    "speed": 123,
    "lane": 1
  },
  {},
  {}
]
```

### Control Service


### Dashboard
#### GET `/` & GET `/assets`
Returns web resources needed for the dashboard frontend.

#### GET `/logs?from=..&to=..`
Gets the old log entries in the timespan from `from` to `to`.

The JSON response is an array of log messages, see [log messages](#log-messages) below.

#### GET `/logs/live`
Gets a server sent event (SSE) stream for incoming new log messages.

The JSON body of a log message event is the same as the entries of the GET endpoint.

#### GET `/map`
Gets the default map view parameters.

```json
{
  "long": -98.98901,
  "lat": 44.55984,
  "zoom": 11
}
```

#### GET `/vehicles`
Gets the current positions of all active vehicles.
Calls to beachcomb service GET `/vehicles/positions` via the REST gateway.
For parameter descriptions see the [beachcomb service](#get-vehiclespositions).

#### GET `/vehicles/live`
Gets a server sent event (SSE) stream for incoming new vehicle positions.

The JSON body of a vehicle update message event is the same as the entries of the GET endpoint.


## Message Channels

```mermaid
stateDiagram-v2
    Vehicle --> Beachcomb: Status updates
    Beachcomb --> Control: Vehicle status
    Beachcomb --> Control: Close vehicles
    Beachcomb --> Dashboard: Vehicle status
    Control --> Beachcomb: Available vehicles
    Control --> Dashboard: Log message
    Control --> Vehicle: Control message
    Control --> Control: Pairing probing
```

### Vehicle status updates
Vehicles send their current status to this channel. The beachcomb service consumes these
messages, verifies/validates them, and processes them.

The JSON body of a status update of a vehicle:
```json
{
  "time": "...",
  "VIN": "...",
  "location": {
    "long": 123,
    "lat": 123,
    "heading": 123,
  },
  "speed": 123,
  "lane": 1,
  "follow_me": {
    "speed": 123,
    "lane": 123
  }
}
```

- The `VIN` (vehicle identification number) field is a 17 character string uniquely identifying the vehicle. 
- The `lane` field is a value between 1 and 3, where 1 is the right most lane on a street/road.
- The `follow_me` field data is only set/present if the vehicle is currently in the follow-me mode.
  - For a leading (autonomous) vehicle speed and lane fields are sent.
  - For a following (not autonomous) vehicle a boolean is set to `true`.

### Vehicle control message
In follow-me mode both participants (leading and following) get sent control messages to their respective
direct exchange channel by the control service.

The JSON body of a control message to a leading vehicle:
```json
{
  "time": "...",
  "follow_me": {
    "VIN": "..."
  }
}
```

- The `follow_me` field is only populated when the leading vehicle is in follow-me mode and has an active follower.
- The `follow_me.VIN` field is the VIN of the following vehicle.

The JSON body of a control message to a following vehicle:
```json
{
  "time": "...",
  "follow_me": {
    "VIN": "...",
    "speed": 123,
    "lane": 1
  }
}
```

- The `follow_me` field is only populated when the following vehicle is in follow-me mode and has an active leading vehicle.
- The `follow_me.VIN` field is the VIN of the leading vehicle.
- The `follow_me.speed` and `follow_me.lane` fields are the current driving target.

### Close vehicles
The beachcomb service monitors the active vehicles and detects when two vehicles come close to each other. It then sends
a message if the two vehicles are compatible and available to the channel. The control service consumes these messages
and tries to establish a follow-me link.

The JSON body of a close vehicles message:
```json 
{
  "VIN_follower": "...",
  "VIN_leading": "...",
}
```

### Available vehicles
The control service sends messages which vehicles are available for paring. The service only sends updates
when the availability of vehicles change. The messages are consumed by the beachcomb service, which has to
check which available vehicles are close.

The JSON body of a available vehicles message:
```json
{
  "available": ["...", "..."],
  "unavailable": ["...", "..."]
}
```

- The `available` field is an array of VINs that are now available.
- The `unavailable` field is an array of VINs that are now unavailable.

### Vehicle status
The beachcomb service regularly broadcasts the position updates of vehicles. The control service and dashboard consume
these messages.

The JSON message body has the same shape as the data returned from the REST [GET endpoint](#get-vehiclespositions) of the
beachcomb service.


### Pairing probing
The control service sends this message with a delay when the followMe pairing is established to itself. When it is received the pairing checks are performed, and on success another probing message is sent after some delay. This way different control service instances can perform the pairing checks which prevents one pairing being bound to a single control service instance.

The JSON body of every pairing probing message:
```json
{
  "startTime": "ISO time string",
  "leadingVIN": "...",
  "isStrict": false
}
```

- The `isStrict` field indicates whether the next probing check should be performed strictly.


### Log messages
The control service send its log messages to the log channel, where they get consumed by the dashboard.

The basic JSON body of every log message:
```json
{
  "time": "...",
  "severity": "info",
  "message": "...",
  "type", "follow_me_start",
  "data": {}
}
```

- The `severity` field is either `info`, `warning` or `alarm`
- The `message` field is a human readable textual representation of the message.
- The `type` field is the type of log message.
- The `data` field is machine readable representation of the message, that contains the important data.

The following `data` fields are defined for specific log messages.
- `vehicle_registered`: `VIN`, `name`
- `follow_me_start`: `VIN_follower`, `VIN_leader`
- `follow_me_end`: `VIN_follower`, `VIN_leader`
- `follow_me_tolerance_error`: `VIN_follower`, `VIN_leader`, `deviation_type`, `deviation_value`
  

## Tech Stack

- Message Broker: RabbitMQ

- Containerization:
 - Docker + Kubernetes(GKE)
 - Google Cloud mit Github verknüpfen

- Webserver/REST: NodeJS

- DB: MongoDB (with geospatial queries)

