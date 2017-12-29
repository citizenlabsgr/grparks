"""Reads park millage input data from file."""

import csv
import collections

from parks import common

log = common.logger(__name__)


def read(path):
    """Parse a CSV flat file into an ordered dictionary."""

    parks = collections.OrderedDict()

    log.info("reading %s...", path)
    with open(path, 'r') as csvfile:

        rows = csv.reader(csvfile)

        header = None
        for row in rows:
            if not row:
                continue

            if header is None:
                header = row
                log.debug("header: %s", header)
            else:
                log.debug("row: %s", row)
                data = common.AttributeDictionary()
                name = row[0]
                for index, key in enumerate(header):
                    data[key] = row[index]
                parks[name] = data

    log.info("read %s parks", len(parks))
    return parks
