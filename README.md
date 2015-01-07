ParkFinder
==========

TBD

[![Build Status](http://img.shields.io/travis/friendlycode/osm-park-finder/master.svg)](https://travis-ci.org/friendlycode/osm-park-finder)
[![Coverage Status](http://img.shields.io/coveralls/friendlycode/osm-park-finder/master.svg)](https://coveralls.io/r/friendlycode/osm-park-finder)
[![Scrutinizer Code Quality](http://img.shields.io/scrutinizer/g/friendlycode/osm-park-finder.svg)](https://scrutinizer-ci.com/g/friendlycode/osm-park-finder/?branch=master)
[![PyPI Version](http://img.shields.io/pypi/v/ParkFinder.svg)](https://pypi.python.org/pypi/ParkFinder)
[![PyPI Downloads](http://img.shields.io/pypi/dm/ParkFinder.svg)](https://pypi.python.org/pypi/ParkFinder)


Getting Started
===============

Requirements
------------

* Python 3.3+
* GEOS (`brew install geos`)


Installation
------------

ParkFinder can be installed with pip:

```
$ pip install ParkFinder
```

or directly from the source code:

```
$ git clone https://github.com/friendlycode/osm-park-finder.git
$ cd osm-park-finder
$ python setup.py install
```

Basic Usage
===========

After installation, abstract base classes can be imported from the package:

```
$ python
>>> import parks
parks.__version__
```

ParkFinder doesn't do anything, it's a template.

For Contributors
================

Requirements
------------

* Make:
    * Windows: http://cygwin.com/install.html
    * Mac: https://developer.apple.com/xcode
    * Linux: http://www.gnu.org/software/make (likely already installed)
* virtualenv: https://pypi.python.org/pypi/virtualenv#installation
* Pandoc: http://johnmacfarlane.net/pandoc/installing.html
* Graphviz: http://www.graphviz.org/Download.php

Installation
------------

Create a virtualenv:

```
$ make env
```

Run the tests:

```
$ make test
$ make tests  # includes integration tests
```

Build the documentation:

```
$ make doc
```

Run static analysis:

```
$ make pep8
$ make pep257
$ make pylint
$ make check  # includes all checks
```

Prepare a release:

```
$ make dist  # dry run
$ make upload
```
