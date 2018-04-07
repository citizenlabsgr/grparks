"""Finds parks using OpenStreetMap."""

import log
import osmapi

from .grboundary import POLYGON

# List of bounding boxes and the number of slices to split the box into
# bounding boxes must stay within the API limits:
# http://wiki.openstreetmap.org/wiki/API_v0.6#Capabilities:_GET_.2Fapi.2Fcapabilities
BBOXES = (

    # outer bounding box for the city
    # polygon.bounds => (minx, miny, maxx, maxy)
    # http://toblerity.org/shapely/manual.html#Polygon
    ({
        'min_lat': POLYGON.bounds[1] - .001,
        'min_lon': POLYGON.bounds[0] - .001,
        'max_lat': POLYGON.bounds[3] + .001,
        'max_lon': POLYGON.bounds[2] + .001,
    }, 5),

    # a secondary bounding box to pick up Aman Park
    ({
        'min_lat': 42.970904,
        'min_lon': -85.842360,
        'max_lat': 42.988047,
        'max_lon': -85.822018,
    }, 1),
)

# list of non-parks that should be collected
PARK_NAMES = (
    "Indian Trails Golf Course",
    "Riverwalk Trails",
    "Covell Dog Park",
)


def find(debug=False):
    """Display park data in the bounding box."""
    data = []
    parks = 0

    # Create an API connection
    log.info("connecting to OSM...")
    api = osmapi.OsmApi()

    for count, (out_bbox, sections) in enumerate(BBOXES, start=1):

        # Iterate through each section of the bounding box
        log.info("loading bounding box %s...", count)
        log.debug("outer bounding box: %s", out_bbox)
        height = (out_bbox['max_lat'] - out_bbox['min_lat']) / sections
        width = (out_bbox['max_lon'] - out_bbox['min_lon']) / sections
        for row in range(sections):
            if debug and row != int(sections / 2):
                continue
            for col in range(sections):
                if debug and col != int(sections / 2):
                    continue

                log.info("loading region (%s, %s) of (%s, %s) ...",
                         row, col, sections - 1, sections - 1)

                # define an inner bounding box
                bbox = {'min_lat': out_bbox['min_lat'] + row * height,
                        'min_lon': out_bbox['min_lon'] + col * width,
                        'max_lat': out_bbox['min_lat'] + (row + 1) * height,
                        'max_lon': out_bbox['min_lon'] + (col + 1) * width}
                log.debug("inner bounding box: %s", bbox)

                # get a list of points in a given bounding box
                # http://osmapi.divshot.io/#OsmApi.OsmApi.Map
                points = api.Map(**bbox)

                # find all parks in the list of points
                for point in points:
                    if point['type'] == 'node':
                        data.append(point)
                    if point['type'] in ('way', 'relation'):
                        if any(((point['data']['tag'].get('leisure') == 'park'),
                                (point['data']['tag'].get('name') in PARK_NAMES))):
                            log.debug("found park: %s", point['data'])
                            data.append(point)
                            parks += 1

    log.info("found %s parks", parks)
    return data
