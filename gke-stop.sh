
# Delete all deployments
sh ./gke-clean.sh

# Stop DB
gcloud sql instances patch dse24-db --activation-policy=NEVER

# Downscale Cluster to 0
gcloud container clusters update dse24-cluster --no-enable-autoscaling --node-pool default-pool --zone=europe-west6-a
echo "y" | gcloud container clusters resize dse24-cluster --num-nodes=0 --zone=europe-west6-a
