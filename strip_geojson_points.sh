#!/bin/sh

head -n $(( $( grep -n -m 1 '"type": "Point"' parks.geojson | cut -f1 -d: ) - 14)) parks.geojson > _
mv _ parks.geojson
echo "}}" >> parks.geojson
