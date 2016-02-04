#!/usr/bin/env python3

"""Generates GeoJSON to map millage data to parks on OpenStreetMap.

Usage:
  main.py <path> [--verbose] [--debug]

Options:
  --verbose   Enable verbose logging.
  --debug     Use a smaller data set to fail faster.

"""

import sys
import csv
import json
import logging

from docopt import docopt

from parks import common
from parks import reader
from parks import finder

OUTPUT_CSV = "parks.csv"
OUTPUT_OSM_JSON = "parks.osm_json"

log = common.logger(__name__)


def main(argv=None):
    """Parse arguments and run the program."""

    # Parse arguments
    arguments = docopt(__doc__, argv=argv or sys.argv[1:])
    verbose = arguments.get('--verbose')
    debug = arguments.get('--debug')
    input_csv_path = arguments['<path>']

    # Configure logging
    logging.basicConfig(level=logging.DEBUG if verbose else logging.INFO,
                        format="%(levelname)s: %(name)s: %(message)s")

    # Run the program
    success = run(input_csv_path, OUTPUT_CSV, OUTPUT_OSM_JSON, debug=debug)

    if not success:
        sys.exit(1)


def run(input_csv_path, output_csv_path, output_osm_json_path, debug=False):
    """Merge the input data with OpenStreetMap data."""

    success = True

    # Read the input millage data
    millage_parks = reader.read(input_csv_path)

    # Find all parks on OSM
    osm_points = finder.find(debug=debug)
    osm_parks = {}
    for point in osm_points:
        if point['type'] in ('way', 'relation'):
            data = point['data']
            name = data['tag'].get('name', '<unknown>')
            osm_parks[name] = data

    # Display the difference between both park lists
    for name in millage_parks.keys():
        if name not in osm_parks:
            log.error("missing park on OSM: %s", name)
            success = False
    for name in osm_parks.keys():
        if name not in millage_parks:
            log.warning("missing park in CSV: %s", name)

    # Write the relevant OSM data to a flat file
    log.info("writing %s...", output_csv_path)
    with open(output_csv_path, 'w', newline='') as csvfile:
        csvwriter = csv.writer(csvfile)
        for park in osm_parks.values():
            csvwriter.writerow([park['id'], park['tag'].get('name')])

    # Generate new OSM JSON parks data with millage information
    modified_osm_points = []
    for point in osm_points:
        name = point['data']['tag'].get('name')
        if name:
            if name not in millage_parks:
                log.info("skipped untagged: %s", name)
                continue
            if point['type'] in ('way', 'relation'):
                point['data']['tag'] = dict(leisure='park')
                millage_park_data = millage_parks[name]
                for key, value in millage_park_data.items():
                    point['data']['tag'][key.lower()] = value
                log.info("tags added to park: %s", name)
        # map to names expected for GeoJSON
        point2 = {}
        point2['type'] = point['type']
        point2.update(point['data'])
        point2['nodes'] = point2.pop('nd', {})
        point2['tags'] = point2.pop('tag', {})
        modified_osm_points.append(point2)

    # Write the modified OSM data to an OSM JSON file
    log.info("writing %s...", output_osm_json_path)
    with open(output_osm_json_path, 'w') as osm_json_file:
        modified_osm_data = {'elements': modified_osm_points}
        modified_osm_json = json.dumps(modified_osm_data, indent='  ')
        osm_json_file.write(modified_osm_json)

    return success or debug


if __name__ == '__main__':
    main()
