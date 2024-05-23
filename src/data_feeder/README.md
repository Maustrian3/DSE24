# Datafeeder service

## Feed data to the cloud
To feed data to the cloud from your local machine, you need to setup the
configuration for connecting to the cluster. Copy the `.env` file and
set the IPs/host names, usernames and passwords of the cluster.

Run the data feeder with the `--config` option.
```bash
node . --config cloud.env
```
