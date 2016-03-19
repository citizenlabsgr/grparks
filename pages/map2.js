var constants = {
	CITY_BOUNDARY_DATA_URL: "https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/gr.geojson",
	CITY_BOUNDARY_STYLE: {color: "gray", weight: 3, fill: false, clickable: false},
	CITY_CENTER: {lat: 42.9614844, lon: -85.6556833},
	NEIGHBORHOOD_BOUNDARY_DATA_URL: "https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/neighborhoods.geojson",
	NEIGHBORHOOD_BOUNDARY_STYLE: {weight: 1, fill: false, clickable: false},
	PARKS_DATA_URL: "https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/parks.geojson",
	PARKS_STYLE: {color: "#ff7800", weight: 1, opacity: 0.65, clickable: false},
	PARK_TYPES: ["Community", "Mini", "Neighborhood", "Urban"],
	MARKER_ICON_PATH: "images/marker-icons/",
	BASE_LAYERS: {"Default": "github.kedo1cp3", "Streets": "mapbox.streets", "Grayscale": "mapbox.light", "Emerald": "mapbox.emerald"}, // do not delete the first one ("Default")
	CHOROPLETH_COLORS: ['#ffffff','#f2f0f7','#cbc9e2','#9e9ac8','#756bb1','#54278f']
	};

var ids = [], markers = [], neighborhoods = [], baseLayers = {}, overlayLayers = {}, markerClicked = false;

var cityLayer = new L.layerGroup(),
	neighborhoodLayer = new L.layerGroup(),
	parkLayer = new L.layerGroup();

for (i = 0; i < constants.PARK_TYPES.length; i++) {
	overlayLayers[markerLabel(constants.PARK_TYPES[i])] = new L.layerGroup();
	}

var theCity = new customLayer(
	cityLayer, 
	constants.CITY_BOUNDARY_DATA_URL, 
	constants.CITY_BOUNDARY_STYLE
	);
theCity.getData();

var theNeighborhoods = new customLayer(
	neighborhoodLayer,
	constants.NEIGHBORHOOD_BOUNDARY_DATA_URL,
	constants.NEIGHBORHOOD_BOUNDARY_STYLE
	);
theNeighborhoods.onEachFeature = function(feature, layer) {
	var x = {poly: layer, name: feature.properties.NEBRH, dollars: 0};
	neighborhoods.push(x);
	}
theNeighborhoods.getData();

var theParks = new customLayer(
	parkLayer, 
	constants.PARKS_DATA_URL, 
	constants.PARKS_STYLE
	);
theParks.onEachFeature = addMarker;
theParks.getData();


function isEverythingReady() {
	if (baseMap.ready && theCity.ready && theNeighborhoods.ready && theParks.ready) {
		ids = undefined;
		makeParkList();
		cityLayer.addTo(baseMap.map);
		parkLayer.addTo(baseMap.map);
		for (key in overlayLayers) {overlayLayers[key].addTo(baseMap.map);}
		overlayLayers["Neighborhoods"] = neighborhoodLayer;
		L.control.layers(baseLayers, overlayLayers, {position: "topright", collapsed: false}).addTo(baseMap.map);
		for (i = 0; i < neighborhoods.length; i++) {
//			console.log(neighborhoods[i].name + ": " + neighborhoods[i].dollars);
			function getColor(d) {
			    return d > 1000000 ? constants.CHOROPLETH_COLORS[5] :
			           d > 750000  ? constants.CHOROPLETH_COLORS[4] :
			           d > 500000  ? constants.CHOROPLETH_COLORS[3] :
			           d > 250000  ? constants.CHOROPLETH_COLORS[2] :
			           d > 0   ? constants.CHOROPLETH_COLORS[1] :
			                      constants.CHOROPLETH_COLORS[0];
				}
			console.log(neighborhoods[i].name + ": " + getColor(neighborhoods[i].dollars));
			neighborhoods[i].poly.setStyle({fill: true, fillColor: getColor(neighborhoods[i].dollars)});
			}
		}
	}


window.onload = function() {
	baseMap.init("map", constants.CITY_CENTER);
	isEverythingReady();
	}


baseMap = {
	
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
	
		for (key in constants.BASE_LAYERS) {
			var layer = L.tileLayer(u, {id: constants.BASE_LAYERS[key], attribution: a, minZoom: 11, maxZoom: 17});
			baseLayers[key] = layer;
			}
		
		this.map = L.map(div, {center: center, zoom: 12, layers: baseLayers["Default"]});					
		this.map.on("overlayadd", function(e) {
			if (e.name != "Neighborhoods") {overlayLayers[e.name].eachLayer(function(layer) {liPark(layer.index).style.display = "block";});}
			})
		this.map.on("overlayremove", function(e) {
			if (e.name != "Neighborhoods") {overlayLayers[e.name].eachLayer(function(layer) {liPark(layer.index).style.display = "none";});}
			})

		this.ready = true;
		
		}
	}


function customLayer(layer, url, style) {
	
	this.layer = layer;
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
				L.geoJson(JSON.parse(xobj.responseText), {
					onEachFeature: x.onEachFeature, 
					style: x.style
					}).addTo(x.layer);
				x.ready = true;
				isEverythingReady();
				}
			};
	    xobj.send(null);  	
		}
		
	return this;
	
	}


function addMarker(feature, layer) {
	
	var newIcon = L.Icon.Default.extend({options: {}});
	
	if (ids.indexOf(feature.id) == -1 && feature.properties && feature.properties.name) {		
	
		ids.push(feature.id);
				
		var thisMarker = L.marker(layer.getBounds().getCenter(), {
			icon: new newIcon({iconUrl: srcFromMarkerType(feature.properties.type)}), 
			riseOnHover: true
			}).addTo(overlayLayers[markerLabel(feature.properties.type.split(" ")[0])]);
		thisMarker.on("click", function(e) {markerClicked = true});
		thisMarker.on("popupopen", function(e) {clickPark(e, true)});
		thisMarker.on("popupclose", function(e) {clickPark(e), false});
		thisMarker.park = {
			"name": feature.properties.name, 
			"acreage": feature.properties.acreage,
			"pool": feature.properties.pool,
			"millage": feature.properties.millage		
			};
		thisMarker.dollars = Number(
			feature.properties.millage.replace(".00", "").replace("$", "").replace(",", "")
			);

		function header() {
			return (
				"<h3>" + thisMarker.park.name + "</h3>" +
				"<p>" + thisMarker.type + "</p>"
				);
			}
		var oldSetPopup = thisMarker.setPopupContent;
		function newSetPopup(long) {
			var msg = header();
			if (long) {msg += "description of improvements would go here";}
			oldSetPopup.call(thisMarker, msg);
			}
		thisMarker.setPopupContent = newSetPopup;
		thisMarker.type = feature.properties.type + " " + feature.properties.leisure;
		thisMarker.bindPopup(header(), {closeButton: false, maxHeight: 300});
		
		markers.push(thisMarker);
		
		}
	
	}


function makeParkList() {
	
	markers.sort(function(a, b){return (a.park.name.toUpperCase() > b.park.name.toUpperCase()) ? 1 : -1;});
	
	for (i = 0; i < markers.length; i++) {
		
		var thisMarker = markers[i],
			thisPark = JSON.parse(JSON.stringify(thisMarker.park)),
			a = document.createElement("a"),
			li = document.createElement("li");
			
		thisMarker.index = i;				
		a.href = "javascript:pop(" + i + ");";
		a.title = thisPark.name;
		a.appendChild(imgFromMarkerType(thisMarker.type));		

		for (feature in thisPark) {
			var p = document.createElement("p");
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
							"<a href='#' title='Details of improvements' onclick='moneyClicked(" + i +  ");'>" + thisPark[feature].replace(".00", "") + "&nbsp;<i class='fa fa-info-circle fa-lg'></i></a>";
						;}
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
		
		for (i2 = 0; i2 < neighborhoods.length; i2++) {
		    var polyPoints = neighborhoods[i2].poly.getLatLngs();       
		    var x = thisMarker.getLatLng().lat, y = thisMarker.getLatLng().lng;
		
		    var inside = false;
		    for (var i3 = 0, j3 = polyPoints.length - 1; i3 < polyPoints.length; j3 = i3++) {
		        var xi = polyPoints[i3].lat, yi = polyPoints[i3].lng;
		        var xj = polyPoints[j3].lat, yj = polyPoints[j3].lng;
		
		        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		        if (intersect) inside = !inside;
		    	}
		
		    if (inside) {neighborhoods[i2].dollars += thisMarker.dollars;}
			}
		
		}  

	}


function clickPark(e, open) {
	var index = e.target.index;
	liPark(index).classList.toggle("highlight");
	if (open) {
		if (markerClicked) {
			liPark(index).scrollIntoView();
			markerClicked = false
			}	
		}
	else {
		markers[index].setPopupContent(false);
		}
	}
	
function imgFromMarkerType(type) {
	var img = document.createElement("img");
	img.src = srcFromMarkerType(type);
	return img;
	}

function liPark(index) {
	return (parklist.getElementsByTagName("li")[index]);
	}

function markerLabel(type) {
	return "<img src='" + srcFromMarkerType(type) + "' class='small'>" + type + " Parks";
	}

function moneyClicked(index) {
	markers[index].setPopupContent(true);
	pop(index);
	}

function pop(index) {
	var thisMarker = markers[index],
		where = thisMarker.getLatLng(),
		zoom = baseMap.map.getZoom();
	if (zoom < 15) {zoom = 15;}
	baseMap.map.setView(where, zoom, {animation: true});
	thisMarker.openPopup();
	}

function srcFromMarkerType(type) {
	return constants.MARKER_ICON_PATH + type.split(" ")[0].toLowerCase() + ".png";
	}