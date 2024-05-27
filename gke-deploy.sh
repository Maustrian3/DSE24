
# git clone https://oauth2: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@github.com/PreyMaTU/gke-tests.git

function envsubst_kubectl() {
  cat "$1" | envsubst '$LATEST_COMMIT_HASH' | kubectl apply -f -
}

if [ "$1" != '-nogit' ]; then
  echo "#### Pulling sources from repo ####"

  git clean -fd
  git restore *
  git pull

  if [ $? -ne 0 ]; then
    echo "Error: git pull failed."
    exit 1
  fi
fi

export LATEST_COMMIT_HASH=$(git rev-parse HEAD)

echo "Pulling images with tag $LATEST_COMMIT_HASH"

echo "#### Updating config map ####"
envsubst_kubectl config-map.yaml

echo "#### Running services ####"
envsubst_kubectl src/rabbitmq_service/deploy.yaml
envsubst_kubectl src/rabbitmq_service/service.yaml

envsubst_kubectl src/beachcomb_service/deploy.yaml
envsubst_kubectl src/beachcomb_service/service.yaml

envsubst_kubectl src/inventory_service/deploy.yaml
envsubst_kubectl src/inventory_service/service.yaml

envsubst_kubectl src/control_service/deploy.yaml
envsubst_kubectl src/control_service/service.yaml

envsubst_kubectl src/dashboard_service/deploy.yaml
envsubst_kubectl src/dashboard_service/service.yaml

envsubst_kubectl src/ingress_service/ingress.yaml

