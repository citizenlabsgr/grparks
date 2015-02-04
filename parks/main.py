"""Generates GeoJSON to map millage data to parks on OpenStreetMap."""

import sys
import csv
import logging

from parks import common
from parks import reader
from parks import finder

OUTPUT_CSV = "parks.csv"

log = common.logger(__name__)


def main(args=None):
    """Parse arguments and run the program."""

    # Parse arguments
    args = args or sys.argv  # TODO: replace this with an `argparse` CLI
    assert len(args) == 2
    input_csv_path = args[1]

    # Configure logging
    logging.basicConfig(level=logging.INFO,
                        format="%(levelname)s: %(name)s: %(message)s")

    # Run the program
    success = run(input_csv_path, OUTPUT_CSV)

    if not success:
        sys.exit(1)


def run(input_csv_path, output_csv_path):
    """Merge the input data with OpenStreetMap data."""

    # Read the input millage data
    millage_parks = reader.read(input_csv_path)

    # Find all parks on OSM
    osm_geojson = finder.find()
    osm_parks = {}
    for data in osm_geojson.values():
        name = data['tag'].get('name', '<unknown>')
        osm_parks[name] = data

    # Write the relevant OSM data to a flat file
    log.info("writing %s...", output_csv_path)
    with open(output_csv_path, 'w', newline='') as csvfile:
        csvwriter = csv.writer(csvfile)
        for park in osm_geojson.values():
            csvwriter.writerow([park['id'], park['tag'].get('name')])

    # Compare the park names
    success = True
    for name in millage_parks.keys():
        if name not in osm_parks:
            log.error("missing OSM park: %s", name)
            success = False
    for name in osm_parks.keys():
        if name not in millage_parks:
            log.warning("missing CSV park: %s", name)
            success = False

    return success


if __name__ == '__main__':
    main()
