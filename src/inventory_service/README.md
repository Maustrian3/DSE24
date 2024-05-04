# Inventory Service

## Setup local database

```SQL
create database dse24;
use dse24;

create table inventory_vehicle (
  id int auto_increment,
  vin char(17) not null,
  name varchar(100) not null,
  oem varchar(30) not null, 
  model_type varchar(30) not null, 
  is_leading tinyint(1) not null, 
  primary key(id), 
  unique(vin)
);

```

