#!/bin/bash

docker login --username $DOCKER_ACCESS_NAME -p $DOCKER_ACCESS_TOKEN

docker stop ede_stats_prod
docker rm -f ede_stats_prod
docker rmi -f 37976120/ede_stats:prod

docker-compose -f docker-compose_prod.yml up -d ede_stats_prod
