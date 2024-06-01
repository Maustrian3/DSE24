# Datafeeder service

## Feed data to the cloud
To feed data to the cloud from your local machine, you need to setup the
configuration for connecting to the cluster. Copy the `.env` file and
set the IPs/host names, usernames and passwords of the cluster.

Run the data feeder with the `--config` option.
```bash
node . --config cloud.env
```

You can also list and select one of a few predefined scenarios. If no scenario
is specified, the default one from the task description is selected, where the
following vehicle disobeys commands after some time in follow-me mode.

List available scenarios
```bash
node . --list
```

Select scenario with index `2`.
```bash
node . --scenario 2
```
