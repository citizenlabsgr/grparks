"""Generates GeoJSON to map millage data to parks on OpenStreetMap."""

import sys
import csv
import json
import logging

from parks import common
from parks import reader
from parks import finder

OUTPUT_CSV = "parks.csv"
OUTPUT_OSM_JSON = "parks.osm_json"

log = common.logger(__name__)


def main(args=None):
    """Parse arguments and run the program."""

    # Parse arguments
    args = args or sys.argv  # TODO: replace this with an `argparse` CLI
    assert len(args) in (2, 3)
    if '--debug' in args:
        debug = True
        args.remove('--debug')
    else:
        debug = False
    input_csv_path = args[1]

    # Configure logging
    logging.basicConfig(level=logging.DEBUG if debug else logging.INFO,
                        format="%(levelname)s: %(name)s: %(message)s")

    # Run the program
    success = run(input_csv_path, OUTPUT_CSV, OUTPUT_OSM_JSON, debug=debug)

    if not success:
        sys.exit(1)


def run(input_csv_path, output_csv_path, output_osm_json_path, debug=False):
    """Merge the input data with OpenStreetMap data."""

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

    # Write the relevant OSM data to a flat file
    log.info("writing %s...", output_csv_path)
    with open(output_csv_path, 'w', newline='') as csvfile:
        csvwriter = csv.writer(csvfile)
        for park in osm_parks.values():
            csvwriter.writerow([park['id'], park['tag'].get('name')])

    # Generate new OSM JSON parks data with millage information
    modified_osm_points = []
    for point in osm_points:
        if point['type'] in ('way', 'relation'):
            name = point['data']['tag'].get('name')
            try:
                millage_park_data = millage_parks[name]
            except KeyError:
                log.debug("no tags added to park: %s", name)
            else:
                point['data']['tag']['foo'] = 'bar'
                for key, value in millage_park_data.items():
                    point['data']['tag'][key] = value
                log.debug("tags added to park: %s", name)
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

    # Compare the park names
    success = True
    for name in millage_parks.keys():
        if name not in osm_parks:
            log.error("missing park on OSM: %s", name)
            success = False
    for name in osm_parks.keys():
        if name not in millage_parks:
            log.warning("missing park in CSV: %s", name)
            success = False

    # TODO: for now, always return True so we can view all parks
    return success or debug or True


if __name__ == '__main__':
    main()
