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

# Maybe pass a flag to do the service start?
# start_services