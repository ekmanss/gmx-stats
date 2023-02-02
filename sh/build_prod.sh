#!/bin/sh
yarn

yarn build

docker build -t  37976120/ede_stats:prod --platform=linux/amd64 .

docker login --username $DOCKER_ACCESS_NAME -p $DOCKER_ACCESS_TOKEN


docker push 37976120/ede_stats:prod