#!/bin/sh
FILE=/usr/share/nginx/html/assets/config.json
if test -f "$FILE"; then 
	echo "config file already provided"
	exit 0
fi 

TEMPLATE=/usr/share/nginx/html/assets/config-template.json
cp $TEMPLATE $FILE

sed -i -e "s|__DASHBOARD_BASE_URL__|$DASHBOARD_BASE_URL|g" $FILE
sed -i -e "s|__IDM_BASE_URL__|$IDM_BASE_URL|g" $FILE
sed -i -e "s|__TRAFFIC_PREDICTION_API_BASE_URL__|$TRAFFIC_PREDICTION_API_BASE_URL|g" $FILE
sed -i -e "s|__BIKE_ANALYSIS_API_BASE_URL__|$BIKE_ANALYSIS_API_BASE_URL|g" $FILE
sed -i -e "s|__IDRA_BASE_URL__|$IDRA_BASE_URL|g" $FILE
sed -i -e "s|__DATALET_BASE_URL__|$DATALET_BASE_URL|g" $FILE