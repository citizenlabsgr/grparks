"""Finds parks using OpenStreetMap."""

import pprint
import csv

import osmapi

from parks.grboundary import POLYGON

# outer bounding box for the city
# polygon.bounds => (minx, miny, maxx, maxy)
# http://toblerity.org/shapely/manual.html#Polygon
BBOX = {'min_lat': POLYGON.bounds[1],
        'min_lon': POLYGON.bounds[0],
        'max_lat': POLYGON.bounds[3],
        'max_lon': POLYGON.bounds[2]}

# number of divisions to keep the inner bounding boxes within the API limits
# http://wiki.openstreetmap.org/wiki/API_v0.6#Capabilities:_GET_.2Fapi.2Fcapabilities
SECTIONS = 5  # step size to avoid limits:

OUTPUT_CSV = "parks.csv"


def run():
    """Display park data in the bounding box."""
    parks = {}

    # Create an API connection
    api = osmapi.OsmApi()

    # Display the outer bounding box
    print()
    print("(all)")
    pprint.pprint(BBOX)
    print()

    # Iterate through each section of the bounding box
    height = (BBOX['max_lat'] - BBOX['min_lat']) / SECTIONS
    width = (BBOX['max_lon'] - BBOX['min_lon']) / SECTIONS
    for row in range(SECTIONS):
        for col in range(SECTIONS):
            print((row, col))

            # define an inner bounding box
            bbox = {'min_lat': BBOX['min_lat'] + row * height,
                    'min_lon': BBOX['min_lon'] + col * width,
                    'max_lat': BBOX['min_lat'] + (row + 1) * height,
                    'max_lon': BBOX['min_lon'] + (col + 1) * width}
            pprint.pprint(bbox)
            print()

            # get a list of points in a given bounding box
            # http://osmapi.divshot.io/#OsmApi.OsmApi.Map
            points = api.Map(**bbox)

            # find all parks in the list of points
            for point in points:
                if point['type'] == 'way':
                    if point['data']['tag'].get('leisure') == 'park':
                        parks[point['data']['id']] = point['data']

    # Display all park data
    for park in parks.values():
        pprint.pprint(park)
        print()
    print("count: {}".format(len(parks)))

    # Write the relevant data to a flat file
    with open(OUTPUT_CSV, 'w', newline='') as csvfile:
        csvwriter = csv.writer(csvfile)
        for park in parks.values():
            csvwriter.writerow([park['id'], park['tag'].get('name')])


if __name__ == '__main__':
    run()
