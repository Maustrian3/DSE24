
function envsubst_kubectl() {
  cat "$1" | envsubst '$LATEST_COMMIT_HASH' | kubectl apply -f -
}


echo "### Shutting down data feeder ###"
kubectl delete deployment data-feeder
kubectl delete service data-feeder

## Wait for control service to be available
export CONTROL_SERVICE_URL=$(kubectl get cm dse24-config -o json | jq -r '.data.CONTROL_CHECK_URL')
until wget -O/dev/null -q "$CONTROL_SERVICE_URL"; do
  echo "Waiting for control service..."
  sleep 2
done

echo "### Starting data feeder ###"

export LATEST_COMMIT_HASH=$(git rev-parse HEAD)

envsubst_kubectl src/data_feeder/deploy.yaml
envsubst_kubectl src/data_feeder/service.yaml
