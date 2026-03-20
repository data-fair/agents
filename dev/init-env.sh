#!/bin/bash

RANDOM_NB=$((1024 + RANDOM % 48000))
echo "Use random base port $RANDOM_NB"

cat <<EOF > ".env"
NGINX_PORT=$((RANDOM_NB))

DEV_API_PORT=$((RANDOM_NB + 1))
DEV_UI_PORT=$((RANDOM_NB + 2))
DEV_UI_HMR_PORT=$((RANDOM_NB + 3))
MAILDEV_UI_PORT=$((RANDOM_NB + 4))
MAILDEV_SMTP_PORT=$((RANDOM_NB + 5))

MONGO_PORT=$((RANDOM_NB + 10))

SD_PORT=$((RANDOM_NB + 20))
DF_PORT=$((RANDOM_NB + 21))
EVENTS_PORT=$((RANDOM_NB + 22))

OPENSHELL_SANDBOX_POLICY=dev/openshell/policy.yaml
EOF

echo "Generate OpenShell policy"
set -a
source .env
set +a
envsubst '$NGINX_PORT $DEV_API_PORT $DEV_UI_PORT $DEV_UI_HMR_PORT $MAILDEV_UI_PORT $MAILDEV_SMTP_PORT $MONGO_PORT $SD_PORT $DF_PORT $EVENTS_PORT' < dev/openshell/policy.yaml.template > dev/openshell/policy.yaml
