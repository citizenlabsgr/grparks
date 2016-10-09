"use strict";

var settings = {
	city: {
		center: {lat: 42.9614844, lon: -85.6556833},
		style: {color: "gray", weight: 3, fill: false, clickable: false},
		url: "https://raw.githubusercontent.com/citizenlabsgr/grparks/gh-pages/gr.geojson"
		},
	icons: "images/marker-icons/",
	maps: {"Default": "mapbox.emerald", "Grayscale": "mapbox.light"},
	neighborhoods: {
		choropleth: {classes: 5, colors: "Blues"},
		url: "https://raw.githubusercontent.com/citizenlabsgr/grparks/gh-pages/neighborhoods.geojson"
		},
	parks: {
		style: {color: "#ff7800", weight: 1, opacity: 0.65, clickable: false},
		types: ["Community", "Mini", "Neighborhood", "Regional"],
		url: "https://raw.githubusercontent.com/citizenlabsgr/grparks/gh-pages/parks.geojson"
		},
	polygons: {
		highlight: {weight: 5, fill: true, fillOpacity: 0.65, clickable: true},
		style: {weight: 1, fill: true, fillOpacity: 0.65, clickable: true}
		},
	wards: {
		choropleth: {classes: 3, colors: "Blues"},
		url: "https://raw.githubusercontent.com/citizenlabsgr/grparks/gh-pages/wards.geojson"
		}
	};

var ids = [], markers = [], neighborhoods = [], wards = [],
	baseLayers = {}, overlayLayers = {},
	activeBase ="Default", grayscale, i, markerClicked = false, thisMarker;

var mapInfo = L.control({position: 'bottomleft'});
mapInfo.onAdd = function(map) {
	var div = L.DomUtil.create("div", "info");
	this.heading = L.DomUtil.create('div');
	this.legend = L.DomUtil.create('div');
	div.appendChild(this.heading);
	div.appendChild(this.legend);
	return div;
	};
mapInfo.updateHeading = function(props) {
	var singular = activeBase.slice(0, -1);
	this.heading.innerHTML = '<h4>' + singular + ' Investment</h4>' +  (props ?
		'<b>' + props.label + '</b>: ' + (singular == "Ward" ? props.acres.toFixed(1) + " acres, " : "") + '$' + props.money.toLocaleString("en-US", {maximumFractionDigits: 0}) : 'Hover over a ' + singular.toLowerCase());
	};
mapInfo.updateLegend = function() {
	var brew = new classyBrew();
	var values = [0];
	var nonzero = 0;
	var choropleth = settings.neighborhoods.choropleth;
	var layers = neighborhoods;
	if (activeBase == "Wards") {
		choropleth = settings.wards.choropleth;
		layers = wards;
		}
	for (i = 0; i < layers.length; i++) {
		var m = layers[i].feature.properties.money;
		values.push(m);
		if (m != 0) {nonzero += 1;}
		}
	brew.setSeries(values);
	var numClasses = choropleth.classes;
	if (nonzero < numClasses) {numClasses = nonzero;}
	brew.setNumClasses(numClasses);
	brew.setColorCode(choropleth.colors);
	var breaks = brew.classify("jenks");
	var colors = brew.getColors();
	for (i = 0; i < layers.length; i++) {
		var c = "transparent";
		if (colors !== undefined) {c = brew.getColorInRange(layers[i].feature.properties.money);}
		layers[i].setStyle({fill: true, fillColor: c});
		}
	var	labels = [], from, to;
	labels.push("<i style='background: transparent'></i>None");
	for (i = 0; i < breaks.length - 1; i++) {
		from = breaks[i] + 1;
		to = breaks[i + 1];
		labels.push(
			'<i style="background:' + colors[i] + '"></i>$' +
			from.toLocaleString("en-US", {maximumFractionDigits: 0}) + '&ndash;' + to.toLocaleString("en-US", {maximumFractionDigits: 0}));
		}
	this.legend.innerHTML = "<hr>" + labels.join('<br>');
	}

for (i = 0; i < settings.parks.types.length; i++) {
	overlayLayers[labelMarker(settings.parks.types[i])] = new L.layerGroup();
	}

var geojsonCity = new geojsonLayer(settings.city.url, settings.city.style);
geojsonCity.getData();

var geojsonWards = new geojsonLayer(settings.wards.url, settings.polygons.style);
geojsonWards.onEachFeature = function(feature, layer) {
	layer.on({
		click: function(e) {setMapInfo(e);},
		mouseover: function(e) {setMapInfo(e);},
		mouseout: function(e) {resetMapInfo();}
		});
	feature.properties.label = "Ward " + feature.properties.WARD;
	feature.properties.acres = 0;
	feature.properties.money = 0;
	wards.push(layer);
	};
geojsonWards.getData();

var geojsonNeighborhoods = new geojsonLayer(settings.neighborhoods.url, settings.polygons.style);
geojsonNeighborhoods.onEachFeature = function(feature, layer) {
	layer.on({
		click: function(e) {setMapInfo(e);},
		mouseover: function(e) {setMapInfo(e);},
		mouseout: function(e) {resetMapInfo();}
		});
	feature.properties.label = feature.properties.NEBRH;
	feature.properties.acres = 0;
	feature.properties.money = 0;
	neighborhoods.push(layer);
	};
geojsonNeighborhoods.getData();

var geojsonParks = new geojsonLayer(settings.parks.url, settings.parks.style);
geojsonParks.onEachFeature = addMarker;
geojsonParks.getData();


function isEverythingReady() {
	if (
		baseMap.ready &&
		geojsonCity.ready &&
		geojsonWards.ready &&
		geojsonNeighborhoods.ready &&
		geojsonParks.ready
		) {
		ids = undefined;
		makeParkList();
		geojsonCity.layer.addTo(baseMap.map);
		geojsonParks.layer.addTo(baseMap.map);
		var key;
		for (key in overlayLayers) {overlayLayers[key].addTo(baseMap.map);}
		geojsonWards.layer.addTo(baseLayers.Wards);
		geojsonNeighborhoods.layer.addTo(baseLayers.Neighborhoods);
		L.control.layers(baseLayers, overlayLayers, {position: "topright", collapsed: false}).addTo(baseMap.map);
		}
	}


window.onload = function() {
	baseMap.init("map", settings.city.center);
	isEverythingReady();
	};
window.onresize = function() {
	if (screen.width >= 1024) {listDefault();}
	};

var baseMap = {
	ready: false,
	init: function(div, center) {
		var a =
			"<a target='_blank' href='" +
				"https://www.mapbox.com/about/maps/'>&copy; Mapbox</a> " +
			"<a target='_blank' href='" +
				"http://www.openstreetmap.org/copyright'>&copy; OpenStreetMap</a> " +
			"<a target='_blank' href='" +
				"https://www.mapbox.com/map-feedback/#/-85.596/42.997/14'><b>Improve this map</b></a>",
			u = "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZ2l0aHViIiwiYSI6IjEzMDNiZjNlZGQ5Yjg3ZjBkNGZkZWQ3MTIxN2FkODIxIn0.o0lbEdOfJYEOaibweUDlzA"
		baseLayers.Default = new L.tileLayer(u, {id: settings.maps.Default, attribution: a, minZoom: 11, maxZoom: 17});
		grayscale = L.tileLayer(u, {id: settings.maps.Grayscale, attribution: a, minZoom: 11, maxZoom: 17});
		baseLayers.Wards = new L.layerGroup();
		baseLayers.Neighborhoods = new L.layerGroup();
		this.map = L.map(div, {center: center, zoom: 12, layers: baseLayers.Default});
		this.map.on({
			baselayerchange: function(e) {
				activeBase = e.name;
				try {
					mapInfo.removeFrom(baseMap.map);
					}
				catch(err) {}
				if (e.name == "Default") {
					baseMap.map.removeLayer(grayscale);
					}
				else {
					baseMap.map.addLayer(grayscale);
					mapInfo.addTo(baseMap.map);
					mapInfo.updateHeading();
					mapInfo.updateLegend();
					}
				},
			overlayadd: function(e) {overlayChanged(e, true);},
			overlayremove: function(e) {overlayChanged(e, false);}
			});
		this.ready = true;
		}
	};


function geojsonLayer(url, style) {
	this.layer;
	this.ready = false;
	this.style = style;
	this.url = url;
	function onEachFeature() {}
	this.getData = function() {
		var xobj = new XMLHttpRequest();
		if (xobj.overrideMimeType) {xobj.overrideMimeType("application/json");}
		xobj.open('GET', this.url, true);
		var x = this;
		xobj.onreadystatechange = function () {
			if (xobj.readyState == 4 && xobj.status == "200") {
				x.layer = new L.layerGroup();
				L.geoJson(JSON.parse(xobj.responseText), {
					onEachFeature: x.onEachFeature,
					style: x.style
					}).addTo(x.layer);
				x.ready = true;
				isEverythingReady();
				}
			};
	    xobj.send(null);
		};
	return this;
	}


function addMarker(feature, layer) {
	var newIcon = L.Icon.Default.extend({options: {}});
	if (ids.indexOf(feature.id) == -1 && feature.properties && feature.properties.name) {
		ids.push(feature.id);
		var center = layer.getBounds().getCenter();
		if (feature.properties.latitude && feature.properties.longitude) {
			center = L.latLng(feature.properties.latitude, feature.properties.longitude);
			}
		var t = feature.properties.type;
		t = t.charAt(0).toUpperCase() + t.slice(1);
		feature.properties.type = t;
		t = t.split(" ")[0]
		if (settings.parks.types.indexOf(t) == -1) {t = settings.parks.types[0];}
		thisMarker = L.marker(center, {
			icon: new newIcon({iconUrl: srcFromMarkerType(feature.properties.type)}),
			riseOnHover: true
			}).addTo(overlayLayers[labelMarker(t)]);
		thisMarker.money = parseFloat(
			feature.properties.millage.replace("$", "").replace(",", "")
			);
		if (isNaN(thisMarker.money)) {thisMarker.money = 0}
		thisMarker.on({
			click: function(e) {markerClicked = true;},
			popupopen: function(e) {clickPark(e, true);},
			popupclose: function(e) {clickPark(e, false);}
			});
		thisMarker.park = {
			"name": feature.properties.name,
			"acreage": Number(feature.properties.acreage),
			"pool": feature.properties.pool,
			"millage": thisMarker.money //feature.properties.millage
			};
		thisMarker.type = feature.properties.type + " " + feature.properties.leisure;
		var improvements = "";
		if (thisMarker.money != 0) {improvements = "description of improvements would go here";}
		if (feature.properties.description) {improvements = feature.properties.description;}
		thisMarker.bindPopup(
			"<h3>" + thisMarker.park.name + "</h3>" +
			"<p>" + thisMarker.type + "</p>" +
			improvements,
			{closeButton: false, maxHeight: 300}
			);
		markers.push(thisMarker);
		}
	}


function makeParkList() {

	markers.sort(function(a, b){return (a.park.name.toUpperCase() > b.park.name.toUpperCase()) ? 1 : -1;});

	var p, feature, thisPark, a, li;
	for (i = 0; i < markers.length; i++) {

		thisMarker = markers[i];
		thisPark = JSON.parse(JSON.stringify(thisMarker.park));
		a = document.createElement("a");
		li = document.createElement("li");

		thisMarker.index = i;
		a.href = "javascript:pop(" + i + ");";
		a.title = thisPark.name;
		a.appendChild(imgFromMarkerType(thisMarker.type));

		for (feature in thisPark) {
			p = document.createElement("p");
			switch (feature) {
				case "acreage":
					p.textContent = thisPark[feature] + " acres";
					break;
				case "millage":
					if (!thisPark[feature]) {
						p.innerHTML = "&nbsp;";
						}
					else {
						p.innerHTML =
							"$" + thisPark[feature].toLocaleString("en-US", {maximumFractionDigits: 0}) +
							//thisPark[feature].replace(".00", "") + 
							"&nbsp;<i class='fa fa-info-circle fa-lg'></i>";
						}
					break;
				case "pool":
					if (thisPark[feature] == "") {
						p.innerHTML = "&nbsp;";
						}
					else {
						p.textContent = thisPark[feature] + " pool";
						}
					break;
				default:
					p.textContent = thisPark[feature];
				}
			a.appendChild(p);
			}

		li.appendChild(a);
		parklist.appendChild(li);

		thisMarker.ward = polygonContainsMarker(thisMarker, wards);
		thisMarker.neighborhood = polygonContainsMarker(thisMarker, neighborhoods);

//		var n = "", w = "";
//		if (thisMarker.ward != -1) {w = wards[thisMarker.ward].feature.properties.label;}
//		if (thisMarker.neighborhood != -1) {n = neighborhoods[thisMarker.neighborhood].feature.properties.label;}
//		console.log('"' + thisMarker.park.name + '","' + thisMarker.type + '",' + thisMarker.money + ',' + thisMarker.park.acreage + ',"' + n + '","' + w + '"');

		}

	}


function clickPark(e, open) {
	var index = e.target.index;
	liPark(index).classList.toggle("highlight");
	if (open) {
		if (markerClicked) {
			liPark(index).scrollIntoView();
			markerClicked = false;
			}
		}
	}

function imgFromMarkerType(type) {
	var img = document.createElement("img");
	img.src = srcFromMarkerType(type);
	return img;
	}

function labelMarker(type) {
	return "<img src='" + srcFromMarkerType(type) + "' class='small'>" + type;
	}

function liPark(index) {
	return (parklist.getElementsByTagName("li")[index]);
	}

function listToggle() {
	listShow.classList.toggle("hide");
	listHide.classList.toggle("hide");
	parklist.classList.toggle("hide");
	}

function listDefault() {
	listShow.classList.toggle("hide", false);
	listHide.classList.toggle("hide", true);
	parklist.classList.toggle("hide", true);
	}

function overlayChanged(e, show) {
	overlayLayers[e.name].eachLayer(function(thisMarker) {
		liPark(thisMarker.index).style.display = show ? "block" : "none";
		var acresAdjustment, moneyAdjustment;
		if (show) {
			acresAdjustment = thisMarker.park.acreage;
			moneyAdjustment = thisMarker.money;
			}
		else {
			acresAdjustment = -thisMarker.park.acreage;
			moneyAdjustment = -thisMarker.money;
			}
		// some parks aren't in a neighborhood or a ward (-1)
		if (thisMarker.neighborhood != -1) {
			neighborhoods[thisMarker.neighborhood].feature.properties.acres += acresAdjustment;
			neighborhoods[thisMarker.neighborhood].feature.properties.money += moneyAdjustment;
			}
		if (thisMarker.ward != -1) {
			wards[thisMarker.ward].feature.properties.acres += acresAdjustment;
			wards[thisMarker.ward].feature.properties.money += moneyAdjustment;
			}
		});
	mapInfo.updateHeading();
	mapInfo.updateLegend();
	}

function polygonContainsMarker(marker, polygons) {
	var i1, polyPoints, x, y, i2, j2, xi, yi, xj, yj, inside, intersect;
	for (i1 = 0; i1 < polygons.length; i1++) {
	    polyPoints = polygons[i1].getLatLngs();
	    x = marker.getLatLng().lat;
	    y = marker.getLatLng().lng;
	    inside = false;
	    for (i2 = 0, j2 = polyPoints.length - 1; i2 < polyPoints.length; j2 = i2++) {
	        xi = polyPoints[i2].lat;
	        yi = polyPoints[i2].lng;
	        xj = polyPoints[j2].lat;
	        yj = polyPoints[j2].lng;
	        intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
	        if (intersect) inside = !inside;
	    	}
	    if (inside) {
	    	polygons[i1].feature.properties.acres += marker.park.acreage;
	    	polygons[i1].feature.properties.money += marker.money;
	    	return i1;
	    	break;
	    	}
		}
	return -1;
	}

function pop(index) {
	thisMarker = markers[index];
	var where = thisMarker.getLatLng(),
		zoom = baseMap.map.getZoom();
	if (zoom < 15) {zoom = 15;}
	baseMap.map.setView(where, zoom, {animation: true});
	thisMarker.openPopup();
	listDefault();
	}

function resetMapInfo() {
	var layer;
	if (activeBase == "Wards") {layer = geojsonWards.layer;} else {layer = geojsonNeighborhoods.layer;}
	layer.getLayers()[0].setStyle(settings.polygons.style);
	mapInfo.updateHeading();
	}

function setMapInfo(e) {
	resetMapInfo();
	e.target.setStyle(settings.polygons.highlight);
	mapInfo.updateHeading(e.target.feature.properties);
	}

function srcFromMarkerType(type) {
	return settings.icons + type.split(" ")[0].toLowerCase() + ".png";
	}
