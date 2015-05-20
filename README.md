# GR Parks

This project generates maps to visualize the distribution of parks millage.

[![Build Status](http://img.shields.io/travis/friendlycode/gr-parks/master.svg)](https://travis-ci.org/friendlycode/gr-parks)
[![Coverage Status](http://img.shields.io/coveralls/friendlycode/gr-parks/master.svg)](https://coveralls.io/r/friendlycode/gr-parks)
[![Scrutinizer Code Quality](http://img.shields.io/scrutinizer/g/friendlycode/gr-parks.svg)](https://scrutinizer-ci.com/g/friendlycode/gr-parks/?branch=master)

## Setup

### Requirements

* Make:
    * Windows: http://cygwin.com/install.html
    * Mac: https://developer.apple.com/xcode
    * Linux: http://www.gnu.org/software/make (likely already installed)
* Python 3.3+: https://www.python.org/downloads
* virtualenv: https://pypi.python.org/pypi/virtualenv#installation
* GEOS (`brew install geos`)
* Node 0.12+

### Installation

ParkFinder can be installed from the source code:

```
$ git clone https://github.com/friendlycode/gr-parks.git ParkFinder
$ cd ParkFinder
$ make env
```

## Development

To generate new map data from OpenStreetMap:

```
$ make run
```

To run all checks after making code changes:

```
$ make ci
```

## Deployment

Each [Travis CI](https://travis-ci.org/friendlycode/gr-parks) build deploys to the [gh-pages](https://github.com/friendlycode/gr-parks/tree/gh-pages) branch.


