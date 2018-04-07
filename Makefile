# Project settings
PROJECT := Parks
PACKAGE := parks
REPOSITORY := citizenlabsgr/grparks

# Project paths
PACKAGES := $(PACKAGE)
CONFIG := $(wildcard *.py)
MODULES := $(wildcard $(PACKAGE)/*.py)

# Environment paths
export PIPENV_SHELL_COMPAT=true
export PIPENV_VENV_IN_PROJECT=true
export PIPENV_IGNORE_VIRTUALENVS=true
VENV := .venv
NODE_MODULES := node_modules

# MAIN TASKS ##################################################################

SNIFFER := pipenv run sniffer

.PHONY: all
all: install

.PHONY: ci
ci: check test ## Run all tasks that determine CI status

.PHONY: watch
watch: install .clean-test ## Continuously run all CI tasks when files chanage
	$(SNIFFER)

.PHONY: run
run: geojson

# SYSTEM DEPENDENCIES #########################################################

.PHONY: doctor
doctor:  ## Confirm system dependencies are available
	bin/verchew

# PROJECT DEPENDENCIES ########################################################

PYTHON_DEPENDENCIES := $(VENV)/.pipenv-$(shell bin/checksum Pipfile* setup.py)
NODE_DEPENDENCIES := $(VENV)/.npm-$(shell bin/checksum package*.json)

.PHONY: install
install: $(PYTHON_DEPENDENCIES) $(NODE_DEPENDENCIES)

$(PYTHON_DEPENDENCIES):
	pipenv run python setup.py develop
	pipenv install --dev
	@ touch $@

$(NODE_DEPENDENCIES):
	npm install
	@ touch $@

# DATA PIPELINE ###############################################################

CSV_URL := https://doc-04-3o-docs.googleusercontent.com/docs/securesc/ha0ro937gcuc7l7deffksulhg5h7mbp1/gp0cbq1br0rgr2nahva0odgnjsep7joi/1514548800000/04305437294454585726/*/0B0wk6vmRLkMjX1dGc1I0LTNDMElXMUdpcXBaUncxWEpuWXI0?e=download

.PHONY: geojson
geojson: parks.geojson
parks.geojson: install parks.osm_json
	$(NODE_MODULES)/.bin/osmtogeojson -v parks.osm_json -f json > parks.geojson
	./strip_unused_points.sh
	./strip_unused_properties.py parks.geojson
	$(NODE_MODULES)/.bin/geojson-minifier -o pack -f parks.geojson -p 6

.PHONY: osm_json
osm_json: parks.osm_json
parks.osm_json: install data/millage.csv
	pipenv run python $(PACKAGE)/main.py data/millage.csv

ifdef TRAVIS
.PHONY: data/millage.csv
endif
data/millage.csv:
	curl "$(CSV_URL)" > $@
	date +"%B %d, %Y" > timestamp.txt

# CHECKS ######################################################################

PYLINT := pipenv run pylint
PYCODESTYLE := pipenv run pycodestyle
PYDOCSTYLE := pipenv run pydocstyle

.PHONY: check
check: pylint pycodestyle pydocstyle ## Run linters and static analysis

.PHONY: pylint
pylint: install
	$(PYLINT) $(PACKAGES) $(CONFIG) --rcfile=.pylint.ini

.PHONY: pycodestyle
pycodestyle: install
	$(PYCODESTYLE) $(PACKAGES) $(CONFIG) --config=.pycodestyle.ini

.PHONY: pydocstyle
pydocstyle: install
	$(PYDOCSTYLE) $(PACKAGES) $(CONFIG)

# TESTS #######################################################################

NOSE := pipenv run nosetests
COVERAGE := pipenv run coverage
COVERAGE_SPACE := pipenv run coverage.space

RANDOM_SEED ?= $(shell date +%s)

NOSE_OPTIONS := --with-doctest
ifndef DISABLE_COVERAGE
NOSE_OPTIONS += --with-coverage --cover-package=$(PACKAGE) --cover-html --cover-html-dir=htmlcov --cover-branches
endif

.PHONY: test
test: test-all ## Run unit and integration tests

.PHONY: test-unit
test-unit: install .clean-test
	$(NOSE) $(PACKAGE) $(NOSE_OPTIONS)
	$(COVERAGE_SPACE) $(REPOSITORY) unit

.PHONY: test-int
test-int: install .clean-test
	$(NOSE) tests $(NOSE_OPTIONS)
	$(COVERAGE_SPACE) $(REPOSITORY) integration

.PHONY: test-all
test-all: install .clean-test
	$(NOSE) $(PACKAGES) $(NOSE_OPTIONS)
	$(COVERAGE_SPACE) $(REPOSITORY) overall

.PHONY: read-coverage
read-coverage:
	bin/open htmlcov/index.html

# DOCUMENTATION ###############################################################

PYREVERSE := pipenv run pyreverse
MKDOCS := pipenv run mkdocs

MKDOCS_INDEX := site/index.html

.PHONY: docs
docs: uml mkdocs ## Generate documentation

.PHONY: uml
uml: install docs/*.png
docs/*.png: $(MODULES)
	$(PYREVERSE) $(PACKAGE) -p $(PACKAGE) -a 1 -f ALL -o png --ignore tests
	- mv -f classes_$(PACKAGE).png docs/classes.png
	- mv -f packages_$(PACKAGE).png docs/packages.png

.PHONY: mkdocs
mkdocs: install $(MKDOCS_INDEX)
$(MKDOCS_INDEX): mkdocs.yml docs/*.md
	ln -sf `realpath README.md --relative-to=docs` docs/index.md
	ln -sf `realpath CHANGELOG.md --relative-to=docs/about` docs/about/changelog.md
	ln -sf `realpath CONTRIBUTING.md --relative-to=docs/about` docs/about/contributing.md
	ln -sf `realpath LICENSE.md --relative-to=docs/about` docs/about/license.md
	$(MKDOCS) build --clean --strict

.PHONY: mkdocs-live
mkdocs-live: mkdocs
	eval "sleep 3; bin/open http://127.0.0.1:8000" &
	$(MKDOCS) serve

# BUILD #######################################################################

PYINSTALLER := pipenv run pyinstaller
PYINSTALLER_MAKESPEC := pipenv run pyi-makespec

DIST_FILES := dist/*.tar.gz dist/*.whl
EXE_FILES := dist/$(PROJECT).*

.PHONY: build
build: dist

.PHONY: dist
dist: install $(DIST_FILES)
$(DIST_FILES): $(MODULES) README.rst CHANGELOG.rst
	rm -f $(DIST_FILES)
	pipenv run python setup.py check --restructuredtext --strict --metadata
	pipenv run python setup.py sdist
	pipenv run python setup.py bdist_wheel

%.rst: %.md
	pandoc -f markdown_github -t rst -o $@ $<

.PHONY: exe
exe: install $(EXE_FILES)
$(EXE_FILES): $(MODULES) $(PROJECT).spec
	# For framework/shared support: https://github.com/yyuu/pyenv/wiki
	$(PYINSTALLER) $(PROJECT).spec --noconfirm --clean

$(PROJECT).spec:
	$(PYINSTALLER_MAKESPEC) $(PACKAGE)/__main__.py --onefile --windowed --name=$(PROJECT)

# RELEASE #####################################################################

TWINE := pipenv run twine

.PHONY: upload
upload: dist ## Upload the current version to PyPI
	git diff --name-only --exit-code
	$(TWINE) upload dist/*.*
	bin/open https://pypi.python.org/pypi/$(PROJECT)

# CLEANUP #####################################################################

.PHONY: clean
clean: .clean-build .clean-docs .clean-test .clean-install ## Delete all generated and temporary files

.PHONY: clean-all
clean-all: clean
	rm -rf $(VENV)
	rm -rf $(NODE_MODULES)

.PHONY: .clean-install
.clean-install:
	find $(PACKAGES) -name '*.pyc' -delete
	find $(PACKAGES) -name '__pycache__' -delete
	rm -rf *.egg-info

.PHONY: .clean-test
.clean-test:
	rm -rf .cache .pytest .coverage htmlcov xmlreport

.PHONY: .clean-docs
.clean-docs:
	rm -rf *.rst docs/apidocs *.html docs/*.png site

.PHONY: .clean-build
.clean-build:
	rm -rf *.spec dist build

# HELP ########################################################################

.PHONY: help
help: all
	@ grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
