[![Build Status](http://img.shields.io/travis/citizenlabsgr/grparks/master.svg)](https://travis-ci.org/citizenlabsgr/grparks)
[![Coverage Status](https://coveralls.io/repos/citizenlabsgr/grparks/badge.svg?branch=master&service=github)](https://coveralls.io/github/citizenlabsgr/grparks?branch=master)
[![Scrutinizer Code Quality](http://img.shields.io/scrutinizer/g/citizenlabsgr/grparks.svg)](https://scrutinizer-ci.com/g/citizenlabsgr/grparks/?branch=master)

# Overview

This project generates maps to visualize the distribution of parks millage.

## Setup

### Requirements

* Make:
    * Windows: http://mingw.org/download/installer
    * Mac: http://developer.apple.com/xcode
    * Linux: http://www.gnu.org/software/make
* Python 3.6+: https://www.python.org/downloads
* pipenv: http://docs.pipenv.org
* GEOS: https://trac.osgeo.org/geos
* Node: https://nodejs.org

### Installation

ParkFinder can be installed from the source code:

```
$ git clone https://github.com/citizenlabsgr/grparks.git citizenlabs-grparks
$ cd citizenlabs-grparks
$ make install
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
