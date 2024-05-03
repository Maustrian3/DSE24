# DSE24

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
    Control ->>+ Inventory: GET /vehicle/<id>/channel
    Inventory ->>- Control: channel id
    Control ->> Leading: Message: now leading
    Control ->> Follower: Message: now following
    Control ->> Dashboard: Message: log link established
  end
  par Update state
    Leading ->> Beachcomb: Message: current data
    Follower ->> Beachcomb: Message: current data
    Beachcomb ->> Control: Message: vehicle state 
  end
  critical Break link
    Leading ->> Beachcomb: Message: current data
    Follower ->> Beachcomb: Message: current data
    Beachcomb ->> Control: Message: vehicle state
    Control ->> Leading: stop leading
    Control ->> Follower: stop following
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
  Leading ->>+ REST: POST /vehicle
  REST ->>+ Inventory: POST /vehicle
  Inventory ->>- REST: id
  REST ->>- Leading: id
  Follower ->>+ REST: POST /vehicle
  REST ->>+ Inventory: POST /vehicle
  Inventory ->>- REST: id
  REST ->>- Follower: id
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
    Dashboard ->>+ REST: GET /vehicles
    REST ->>+ Beachcomb: GET /vehicles
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

## Tech Stack

- Message Broker: RabbitMQ

- Containerization:
 - Docker + Kubernetes(GKE)
 - Google Cloud mit Github verknüpfen

- Webserver/REST: NodeJS

- DB: MongoDB (with geospatial queries)

