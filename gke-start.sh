
# Start DB
gcloud sql instances patch dse24-db --activation-policy=ALWAYS

# Upscale Cluster
gcloud container clusters update dse24-cluster --enable-autoscaling --node-pool default-pool --zone=europe-west6-a
echo "y" | gcloud container clusters resize dse24-cluster --num-nodes=3 --zone=europe-west6-a

echo "You also need to start the deployments!"
