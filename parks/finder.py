"""Finds parks using OpenStreetMap."""

import osmapi

from parks import common
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

log = common.logger(__name__)


def find(debug=False):
    """Display park data in the bounding box."""
    data = []
    parks = 0

    # Create an API connection
    log.info("connecting to OSM...")
    api = osmapi.OsmApi()

    # Iterate through each section of the bounding box
    log.debug("outer bounding box: %s", BBOX)
    height = (BBOX['max_lat'] - BBOX['min_lat']) / SECTIONS
    width = (BBOX['max_lon'] - BBOX['min_lon']) / SECTIONS
    for row in range(SECTIONS):
        if debug and row != int(SECTIONS / 2):
            continue
        for col in range(SECTIONS):
            if debug and col != int(SECTIONS / 2):
                continue

            log.info("loading region (%s, %s) of (%s, %s) ...",
                     row, col, SECTIONS - 1, SECTIONS - 1)

            # define an inner bounding box
            bbox = {'min_lat': BBOX['min_lat'] + row * height,
                    'min_lon': BBOX['min_lon'] + col * width,
                    'max_lat': BBOX['min_lat'] + (row + 1) * height,
                    'max_lon': BBOX['min_lon'] + (col + 1) * width}
            log.debug("inner bounding box: %s", bbox)

            # get a list of points in a given bounding box
            # http://osmapi.divshot.io/#OsmApi.OsmApi.Map
            points = api.Map(**bbox)

            # find all parks in the list of points
            for point in points:
                if point['type'] == 'node':
                    data.append(point)
                if point['type'] == 'way':
                    if point['data']['tag'].get('leisure') == 'park':
                        log.debug("found park: %s", point['data'])
                        data.append(point)
                        parks += 1

    log.info("found %s parks", parks)
    return data
