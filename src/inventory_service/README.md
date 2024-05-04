# Inventory Service

## Setup local database

```SQL
create database dse24;
use dse24;

create table inventory_vehicles (
  id int auto_increment,
  vin char(17) not null,
  name varchar(100) not null,
  oem varchar(30) not null, 
  model_type varchar(30) not null, 
  is_leading tinyint(1) not null,
  channel_id char(36) not null, 
  primary key(id), 
  unique(vin),
  unique(channel_id)
);

```

## Curls

### Create vehicle
```bash
curl localhost:8080/vehicles -H "Content-Type: application/json" -d "{\"vin\":\"0123456789ABCDEFG\",\"name\":\"kek kar\",\"oem\":\"Renault\",\"model_type\":\"Rennauto\",\"kind\":\"following\"}" -X POST  -v
```

### Get channel id
```bash
curl localhost:8080/vehicles/0123456789ABCDEFG/channel
```
