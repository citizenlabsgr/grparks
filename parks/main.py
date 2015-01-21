"""Generates GeoJSON to map millage data to parks on OpenStreetMap."""

import sys

from parks import finder


def main(args=None):
    """Parse arguments and run the program."""

    # Parse arguments
    # TODO: replace this with an `argparse` CLI
    args = args or sys.argv
    assert len(args) == 2
    input_csv = args[1]

    # Run the program
    run(input_csv)


def run(input_csv):
    """Merge the input data with OpenStreetMap data."""
    print("TODO: parse: {}".format(input_csv))
    finder.run()


if __name__ == '__main__':
    main()
