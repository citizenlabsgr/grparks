"""Finds parks using OpenStreetMap."""

import pprint

import osmapi


# a small section of Grand Rapids containing some park data
BBOX = {'min_lat': 42.9746,
        'min_lon':-85.67,
        'max_lat': 42.978,
        'max_lon':-85.6629}


def run():
    """Display park data in the bounding box."""
    api = osmapi.OsmApi()

    points = api.Map(**BBOX)

    print()
    for point in points:
        if point['type'] == 'way':
            if point['data']['tag'].get('leisure') == 'park':
                pprint.pprint(point['data'])
                print()


if __name__ == '__main__':
    run()
