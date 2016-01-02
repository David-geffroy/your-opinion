#!/bin/bash
PROD=prod
export PROD
pkill -9 node
nohup node /opt/site/certifiid/frontal/app &