#!/bin/bash

. ./prod_config.sh # Load prod configuration

# Build (Pass "no" if already built locally)
if [ "$1" != "no" ]; then
  npm run build
fi

# USING Version 2 of the AWS CLI

# Create bucket and such
# aws s3 mb s3://$BUCKET_NAME
# aws s3 website s3://$BUCKET_NAME/ --index-document index.html

# I pulled a policy from a public bucket I already had and replaced the bucket name manually
# aws s3api get-bucket-policy --bucket $BUCKET_NAME --query Policy --output text > bucket_policy.json

# Create bucket policy
# aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket_policy.json

# Set up a cloudfront distribution
# I copied the config from a previously working distribution
# Doing a manual find and replace on the sub-domain/bucket-name
# aws cloudfront get-distribution-config --id "distributionId" > distribution-config.json
# The above command doesn't provide a great config file I had to piece together parts of it
# To make the one that worked

# Create Cloud front distribution with edited config file
# aws cloudfront create-distribution --distribution-config file://distconfig.json

# Make sure a route 53 route is set point at the cloudfront distribution
# aws route53 list-resource-record-sets --hosted-zone-id "hosted-zone-id"
# list current record sets to get an idea about how to configure a new one

# Create a new route 53 Record with an edited dnsRecord.json
# aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file://dnsRecords.json

# Sync to S3
echo "syncing website to $BUCKET_NAME_TIME_INTENT"
aws s3 sync public/ "s3://${BUCKET_NAME_DEABUTE}/" --delete --exclude "*.sh"
aws s3 sync public/ "s3://${BUCKET_NAME_TIME_INTENT}/" --delete --exclude "*.sh"
echo "done syncing"


# echo "Deploying Lambda function for signaling server ${WSS_URL}"

# cd ../services_plan/signaling_server/
# serverless deploy
