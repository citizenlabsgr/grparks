# Python settings
ifndef TRAVIS
	PYTHON_MAJOR := 3
	PYTHON_MINOR := 5
endif

# Test runner settings
ifndef TEST_RUNNER
	# options are: nose, pytest
	TEST_RUNNER := pytest
endif

# Project settings
PROJECT := Parks
PACKAGE := parks
SOURCES := Makefile setup.py $(shell find $(PACKAGE) -name '*.py')
EGG_INFO := $(subst -,_,$(PROJECT)).egg-info

# System paths
PLATFORM := $(shell python -c 'import sys; print(sys.platform)')
ifneq ($(findstring win32, $(PLATFORM)), )
	WINDOWS := true
	SYS_PYTHON_DIR := C:\\Python$(PYTHON_MAJOR)$(PYTHON_MINOR)
	SYS_PYTHON := $(SYS_PYTHON_DIR)\\python.exe
	# https://bugs.launchpad.net/virtualenv/+bug/449537
	export TCL_LIBRARY=$(SYS_PYTHON_DIR)\\tcl\\tcl8.5
else
	ifneq ($(findstring darwin, $(PLATFORM)), )
		MAC := true
	else
		LINUX := true
	endif
	SYS_PYTHON := python$(PYTHON_MAJOR)
	ifdef PYTHON_MINOR
		SYS_PYTHON := $(SYS_PYTHON).$(PYTHON_MINOR)
	endif
endif

# Virtual environment paths
ENV := env
ifneq ($(findstring win32, $(PLATFORM)), )
	BIN := $(ENV)/Scripts
	ACTIVATE := $(BIN)/activate.bat
	OPEN := cmd /c start
else
	BIN := $(ENV)/bin
	ACTIVATE := . $(BIN)/activate
	ifneq ($(findstring cygwin, $(PLATFORM)), )
		OPEN := cygstart
	else
		OPEN := open
	endif
endif

# Virtual environment executables
ifndef TRAVIS
	BIN_ := $(BIN)/
endif
PYTHON := $(BIN_)python
PIP := $(BIN_)pip
EASY_INSTALL := $(BIN_)easy_install
RST2HTML := $(PYTHON) $(BIN_)rst2html.py
PDOC := $(PYTHON) $(BIN_)pdoc
MKDOCS := $(BIN_)mkdocs
PEP8 := $(BIN_)pep8
PEP8RADIUS := $(BIN_)pep8radius
PEP257 := $(BIN_)pep257
PYLINT := $(BIN_)pylint
PYREVERSE := $(BIN_)pyreverse
NOSE := $(BIN_)nosetests
PYTEST := $(BIN_)py.test
COVERAGE := $(BIN_)coverage
COVERAGE_SPACE := $(BIN_)coverage.space
SNIFFER := $(BIN_)sniffer
HONCHO := PYTHONPATH=$(PWD) $(ACTIVATE) && $(BIN_)honcho

# Flags for PHONY targets
INSTALLED_FLAG := $(ENV)/.installed
DEPENDS_CI_FLAG := $(ENV)/.depends-ci
DEPENDS_DEV_FLAG := $(ENV)/.depends-dev
ALL := $(ENV)/.all

# Main Targets ###############################################################

CKAN_ID := b4efaad7-2e38-4b9e-8bf6-a50113a589d1
CKAN_URL := http://data.grcity.us/dataset/grand-rapids-parks-millage/resource/$(CKAN_ID)

.PHONY: all
all: depends doc $(ALL)
$(ALL): $(SOURCES)
	$(MAKE) check
	@ touch $@  # flag to indicate all setup steps were successful

.PHONY: ci
ci: check test tests

.PHONY: run
run: geojson

.PHONY: geojson
geojson: parks.geojson
parks.geojson: depends parks.osm_json
	osmtogeojson -v parks.osm_json -f json > parks.geojson
	./strip_unused_points.sh
	./strip_unused_properties.py parks.geojson
	geojson-minifier -o pack -f parks.geojson -p 6

.PHONY: osm_json
osm_json: parks.osm_json
parks.osm_json: depends data/millage.csv
	$(PYTHON) $(PACKAGE)/main.py data/millage.csv

ifdef TRAVIS
.PHONY: data/millage.csv
endif
data/millage.csv:
	curl $(CKAN_URL) | grep -m 1 -o 'http:.*\.csv' | xargs curl > $@

# Development Installation ###################################################

.PHONY: env
env: $(PIP) $(INSTALLED_FLAG)
$(INSTALLED_FLAG): Makefile setup.py requirements.txt
	VIRTUAL_ENV=$(ENV) $(PYTHON) setup.py develop
	@ touch $@  # flag to indicate package is installed

$(PIP):
	$(SYS_PYTHON) -m venv --clear $(ENV)
	$(PYTHON) -m pip install --upgrade pip setuptools


# Tools Installation ###########################################################

.PHONY: depends
depends: .depends-ci .depends-dev

.PHONY: .depends-ci
.depends-ci: env Makefile package.json $(DEPENDS_CI_FLAG)
$(DEPENDS_CI_FLAG): Makefile
	$(PIP) install --upgrade pip
	$(PIP) install --upgrade pep8 pep257 $(TEST_RUNNER) coverage
	npm install --global
	touch $(DEPENDS_CI_FLAG)  # flag to indicate dependencies are installed

.PHONY: .depends-dev
.depends-dev: env Makefile $(DEPENDS_DEV_FLAG)
$(DEPENDS_DEV_FLAG): Makefile
	$(PIP) install --upgrade pip
	$(PIP) install --upgrade pep8radius pygments docutils pdoc pylint wheel
	touch $(DEPENDS_DEV_FLAG)  # flag to indicate dependencies are installed

# Documentation ##############################################################

.PHONY: doc
doc: readme apidocs uml

.PHONY: readme
readme: .depends-dev docs/README-github.html docs/README-pypi.html
docs/README-github.html: README.md
	pandoc -f markdown_github -t html -o docs/README-github.html README.md
	cp -f docs/README-github.html docs/README.html  # default format is GitHub
docs/README-pypi.html: README.rst
	$(RST2HTML) README.rst docs/README-pypi.html
README.rst: README.md
	pandoc -f markdown_github -t rst -o README.rst README.md

.PHONY: apidocs
apidocs: .depends-dev apidocs/$(PACKAGE)/index.html
apidocs/$(PACKAGE)/index.html: $(SOURCES)
	$(PDOC) --html --overwrite $(PACKAGE) --html-dir apidocs

.PHONY: uml
uml: .depends-dev docs/*.png
docs/*.png: $(SOURCES)
	$(PYREVERSE) $(PACKAGE) -p $(PACKAGE) -f ALL -o png --ignore test
	- mv -f classes_$(PACKAGE).png docs/classes.png
	- mv -f packages_$(PACKAGE).png docs/packages.png

.PHONY: read
read: doc
	$(OPEN) apidocs/$(PACKAGE)/index.html
	$(OPEN) docs/README-pypi.html
	$(OPEN) docs/README-github.html

# Static Analysis ############################################################

.PHONY: check
check: pep8 pep257 pylint

.PHONY: pep8
pep8: .depends-ci
	$(PEP8) $(PACKAGE) --ignore=E501,E231

.PHONY: pep257
pep257: .depends-ci
	$(PEP257) $(PACKAGE) --add-ignore=D102,D202

.PHONY: pylint
pylint: .depends-dev
	$(PYLINT) $(PACKAGE) --rcfile=.pylintrc --disable=R0914,C0301

.PHONY: fix
fix: .depends-dev
	$(PEP8RADIUS) --docformatter --in-place

# Testing ####################################################################

.PHONY: test
test: test-$(TEST_RUNNER)

.PHONY: tests
tests: tests-$(TEST_RUNNER)

# nosetest commands

.PHONY: test-nose
test-nose: .depends-ci
	$(NOSE) --config=.noserc

.PHONY: tests-nose
tests-nose: .depends-ci
	TEST_INTEGRATION=1 $(NOSE) --config=.noserc --cover-package=$(PACKAGE) -xv

# pytest commands

.PHONY: test-pytest
test-pytest: .depends-ci
	$(COVERAGE) run --source $(PACKAGE) -m py.test $(PACKAGE) --doctest-modules
	$(COVERAGE) report --show-missing --fail-under=20

.PHONY: tests-pytest
tests-pytest: .depends-ci
	TEST_INTEGRATION=1 $(MAKE) test
	$(COVERAGE) report --show-missing --fail-under=20

# Cleanup ####################################################################

.PHONY: clean
clean: .clean-dist .clean-test .clean-doc .clean-build
	rm -rf $(ALL)
	rm -rf *.csv *.osm_json *.geojson*

.PHONY: clean-env
clean-env: clean
	rm -rf $(ENV)

.PHONY: clean-all
clean-all: clean clean-env .clean-workspace

.PHONY: .clean-build
.clean-build:
	find . -name '*.pyc' -delete
	find . -name '__pycache__' -delete
	rm -rf *.egg-info

.PHONY: .clean-doc
.clean-doc:
	rm -rf README.rst apidocs docs/*.html docs/*.png

.PHONY: .clean-test
.clean-test:
	rm -rf .coverage

.PHONY: .clean-dist
.clean-dist:
	rm -rf dist build

.PHONY: .clean-workspace
.clean-workspace:
	rm -rf *.sublime-workspace

# Release ####################################################################

.PHONY: register
register: doc
	$(PYTHON) setup.py register

.PHONY: dist
dist: check doc test tests
	$(PYTHON) setup.py sdist
	$(PYTHON) setup.py bdist_wheel
	$(MAKE) read

.PHONY: upload
upload: .git-no-changes doc
	$(PYTHON) setup.py register sdist upload
	$(PYTHON) setup.py bdist_wheel upload

.PHONY: .git-no-changes
.git-no-changes:
	@if git diff --name-only --exit-code;         \
	then                                          \
		echo Git working copy is clean...;        \
	else                                          \
		echo ERROR: Git working copy is dirty!;   \
		echo Commit your changes and try again.;  \
		exit -1;                                  \
	fi;

# System Installation ########################################################

.PHONY: develop
develop:
	$(SYS_PYTHON) setup.py develop

.PHONY: install
install:
	$(SYS_PYTHON) setup.py install

.PHONY: download
download:
	pip install $(PROJECT)
