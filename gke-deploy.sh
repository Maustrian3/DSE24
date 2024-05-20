
# git clone https://oauth2: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@github.com/PreyMaTU/gke-tests.git

echo "#### Pulling sources from repo ####"

git clean -fd
git restore *
git pull

if [ $? -ne 0 ]; then
  echo "Error: git pull failed."
  exit 1
fi

export LATEST_COMMIT_HASH=$(git rev-parse HEAD)

echo "Pulling images with tag $LATEST_COMMIT_HASH"

echo "#### Updating config map ####"
cat config-map.yaml | envsubst | kubectl apply -f -

echo "#### Running services ####"
cat rabbitmq_service/deploy.yaml | envsubst | kubectl apply -f -
cat rabbitmq_service/service.yaml | envsubst | kubectl apply -f -

cat beachcomb_service/deploy.yaml | envsubst | kubectl apply -f -
cat beachcomb_service/service.yaml | envsubst | kubectl apply -f -

cat inventory_service/deploy.yaml | envsubst | kubectl apply -f -
cat inventory_service/service.yaml | envsubst | kubectl apply -f -

# cat control_service/deploy.yaml | envsubst | kubectl apply -f -
# cat control_service/service.yaml | envsubst | kubectl apply -f -

# cat dashboard_service/deploy.yaml | envsubst | kubectl apply -f -
# cat dashboard_service/service.yaml | envsubst | kubectl apply -f -

cat ingress_service/ingress.yaml | envsubst | kubectl apply -f -


