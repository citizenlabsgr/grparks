var constants = {
	CITY_BOUNDARY_DATA_URL: "https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/gr.geojson",
	CITY_BOUNDARY_STYLE: {color: "yellow", stroke: false, clickable: false},
	CITY_CENTER: {lat: 42.9614844, lon: -85.6556833},
	PARKS_DATA_URL: "https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/parks.geojson",
	PARKS_STYLE: {color: "#ff7800", weight: 1, opacity: 0.65, clickable: false},
	PARK_TYPES: ["Community", "Mini", "Neighborhood", "Urban"],
	MARKER_ICON_PATH: "images/marker-icons/",
	BASE_LAYERS: {"Default": "github.kedo1cp3", "Streets": "mapbox.streets", "Light": "mapbox.light", "Emerald": "mapbox.emerald"}, // do not delete the first one ("Default")
	CHOROPLETH_COLORS: ['#feedde','#fdd0a2','#fdae6b','#fd8d3c','#e6550d','#a63603']
	};

var ids = [], markers = [], baseLayers = {}, markerLayers = {}, markerClicked = false;

var cityLayer = new L.layerGroup(), 
	parkLayer = new L.layerGroup();

for (i = 0; i < constants.PARK_TYPES.length; i++) {
	markerLayers[markerLabel(constants.PARK_TYPES[i])] = new L.layerGroup();
	}

var theCity = new customLayer(
	cityLayer, 
	constants.CITY_BOUNDARY_DATA_URL, 
	constants.CITY_BOUNDARY_STYLE
	);
theCity.getData();

var theParks = new customLayer(
	parkLayer, 
	constants.PARKS_DATA_URL, 
	constants.PARKS_STYLE
	);
theParks.addMarker = addMarker;
theParks.getData();


function isEverythingReady() {
	if (baseMap.ready && theCity.ready && theParks.ready) {
		ids = undefined;
		makeParkList();
		cityLayer.addTo(baseMap.map);
		parkLayer.addTo(baseMap.map);
		for (key in markerLayers) {markerLayers[key].addTo(baseMap.map);}
		L.control.layers(baseLayers, markerLayers, {position: "topright", collapsed: false}).addTo(baseMap.map);
		baseMap.map.on("overlayadd", function(e) {
			markerLayers[e.name].eachLayer(function(layer) {liPark(layer.index).style.display = "block";});
			})
		baseMap.map.on("overlayremove", function(e) {
			markerLayers[e.name].eachLayer(function(layer) {liPark(layer.index).style.display = "none";});
			})
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
		this.ready = true;
		
		}
	}


function customLayer(layer, url, style) {
	
	this.layer = layer;
	this.ready = false;
	this.style = style;
	this.url = url;
	
	function addMarker() {}

	this.getData = function() {
		var xobj = new XMLHttpRequest();
		if (xobj.overrideMimeType) {xobj.overrideMimeType("application/json");}
		xobj.open('GET', this.url, true);
		var x = this;
		xobj.onreadystatechange = function () {
			if (xobj.readyState == 4 && xobj.status == "200") {
				L.geoJson(JSON.parse(xobj.responseText), {
					onEachFeature: x.addMarker, 
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
		
		if (!feature.properties.millage) {feature.properties.millage = "none";};
		
		var thisMarker = L.marker(layer.getBounds().getCenter(), {
			icon: new newIcon({iconUrl: srcFromMarkerType(feature.properties.type)}), 
			riseOnHover: true
			}).addTo(markerLayers[markerLabel(feature.properties.type.split(" ")[0])]);
		thisMarker.on("click", function(e) {markerClicked = true});
		thisMarker.on("popupopen", function(e) {clickPark(e, true)});
		thisMarker.on("popupclose", function(e) {clickPark(e), false});
		thisMarker.park = {
			"name": feature.properties.name, 
			"acreage": feature.properties.acreage,
			"pool": feature.properties.pool,
			"millage": feature.properties.millage		
			};
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
					if (thisPark[feature] == "none") {
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