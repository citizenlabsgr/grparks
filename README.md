# GR Parks

This project generates maps to visualize the distribution of parks millage.

[![Build Status](http://img.shields.io/travis/citizenlabsgr/grparks/master.svg)](https://travis-ci.org/citizenlabsgr/grparks)
[![Coverage Status](https://coveralls.io/repos/citizenlabsgr/grparks/badge.svg?branch=master&service=github)](https://coveralls.io/github/citizenlabsgr/grparks?branch=master)
[![Scrutinizer Code Quality](http://img.shields.io/scrutinizer/g/citizenlabsgr/grparks.svg)](https://scrutinizer-ci.com/g/citizenlabsgr/grparks/?branch=master)

## Setup

### Requirements

* Make:
    * Windows: http://cygwin.com/install.html
    * Mac: https://developer.apple.com/xcode
    * Linux: http://www.gnu.org/software/make (likely already installed)
* Python 3.3+: https://www.python.org/downloads
* virtualenv: https://pypi.python.org/pypi/virtualenv#installation
* GEOS (`brew install geos --with-python`)
* Node 0.12+

### Installation

ParkFinder can be installed from the source code:

```
$ git clone https://github.com/citizenlabsgr/grparks.git citizenlabs-grparks
$ cd citizenlabs-grparks
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

Each [Travis CI](https://travis-ci.org/citizenlabsgr/grparks) build deploys to the [gh-pages](https://github.com/citizenlabsgr/grparks/tree/gh-pages) branch.
