
# Dashboard Service

## Setup local database

```SQL
create database dse24;
use dse24;

create table dashboard_logs (
  id int auto_increment,
  time datetime not null,
  severity enum("info", "warn", "error", "alarm") not null,
  message varchar(500) not null,
  type varchar(32) not null,
  data JSON,
  primary key(id)
);

```
