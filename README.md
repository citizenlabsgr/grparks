ParkFinder
==========

This project generates maps to visualize the distribution of parks millage.

[![Build Status](http://img.shields.io/travis/friendlycode/osm-park-finder/master.svg)](https://travis-ci.org/friendlycode/osm-park-finder)
[![Coverage Status](http://img.shields.io/coveralls/friendlycode/osm-park-finder/master.svg)](https://coveralls.io/r/friendlycode/osm-park-finder)
[![Scrutinizer Code Quality](http://img.shields.io/scrutinizer/g/friendlycode/osm-park-finder.svg)](https://scrutinizer-ci.com/g/friendlycode/osm-park-finder/?branch=master)

Getting Started
===============

Requirements
------------

* Make:
    * Windows: http://cygwin.com/install.html
    * Mac: https://developer.apple.com/xcode
    * Linux: http://www.gnu.org/software/make (likely already installed)
* Python 3.3+: https://www.python.org/downloads
* virtualenv: https://pypi.python.org/pypi/virtualenv#installation
* GEOS (`brew install geos`)
* Node 0.12+

Installation
------------

ParkFinder can be installed from the source code:

```
$ git clone https://github.com/friendlycode/osm-park-finder.git ParkFinder
$ cd ParkFinder
$ make env
```

Basic Usage
===========

To generate new map data from OpenStreetMap:

```
$ make run
```

To run all checks after making code changes:

```
$ make ci
```
