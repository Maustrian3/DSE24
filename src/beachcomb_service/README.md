# Beachcomb Service

## Setup local database

```SQL
create database dse24;
use dse24;

create table beachcomb_vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vin char(17) not null,
  is_leading tinyint(1) not null,
  is_available tinyint(1) not null,
  position POINT not null,
  SPATIAL INDEX(position),
  UNIQUE(vin)
);

```
