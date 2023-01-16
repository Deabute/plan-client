#!/bin/bash
set -e # throw if any command fails
# Other wise this can be thrown into an infinate loop say cd fails

# Load any private env vars
. ./dev_config.sh

# Build front end of app
npm run build

# steps to launch signaling server (If it exist in the following directory)
start_services () {
  cd ../services_plan
  npm start
}

# If nothing is passed the default bx is to start services
if [ -z "$1" ]; then
  start_services
fi