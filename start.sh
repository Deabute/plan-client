#!/bin/bash

# Load any private env vars
. ./dev_config.sh

# Build front end of app
npm run build

# steps to launch signaling server (If it exist in the following directory)
# cd ../services_plan/signaling_server/
# npm start