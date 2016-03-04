// "constants"
var CITY_BOUNDARY_DATA = "https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/gr.geojson";
var CITY_PARKS_DATA = "https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/parks.geojson";
var CITY_MAP_LAYER_COLOR = "yellow";
var CITY_PARKS_LAYER_COLOR = "#ff7800";

loadJSON(CITY_BVOUNDARY_DATA, cityLoaded);

function loadJSON(url, callback) {   
	var xobj = new XMLHttpRequest();
	if (xobj.overrideMimeType) {xobj.overrideMimeType("application/json");}
	xobj.open('GET', url, true);
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {callback(xobj.responseText);}
		};
    xobj.send(null);  
 	}
 
function cityLoaded(response) {
	var city = JSON.parse(response);
	var view = window.location.search.substring(1);
	if (view == "") {view = "github.kedo1cp3";} else {view = "mapbox." + view;}
	map = L.map("map").setView([42.9614844, -85.6556833], 12);
	L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
		attribution: 
			"<a target='_blank' href='" +
				"https://www.mapbox.com/about/maps/'>&copy; Mapbox</a> " +
			"<a target='_blank' href='" +
				"http://www.openstreetmap.org/copyright'>&copy; OpenStreetMap</a> " +
			"<a target='_blank' href='" +
				"https://www.mapbox.com/map-feedback/#/-85.596/42.997/14'><b>Improve this map</b></a>",
		minZoom: 11,
		maxZoom: 17,
		id: view,
		accessToken: "pk.eyJ1IjoiZ2l0aHViIiwiYSI6IjEzMDNiZjNlZGQ5Yjg3ZjBkNGZkZWQ3MTIxN2FkODIxIn0.o0lbEdOfJYEOaibweUDlzA"
		}).addTo(map);
	L.geoJson(city, {
		style: {
			color: CITY_MAP_LAYER_COLOR, 
			weight: 1, 
			clickable: false
			}
		}).addTo(map);
	loadJSON(CITY_PARKS_DATA, parksLoaded);
	}
	
function parksLoaded(response) {
	parks = JSON.parse(response);
	ids = [];
	markers = [];
	L.geoJson(parks, {
		onEachFeature: getFeature, 
		style: {
			color: CITY_PARKS_LAYER_COLOR, 
			weight: 1, 
			opacity: 0.65, 
			clickable: false
			}
		}).addTo(map);
	parks = undefined;
	ids = undefined;
	showFeatures();
	}

function getFeature(feature, layer) {
	if (ids.indexOf(feature.id) == -1 && feature.properties && feature.properties.name) {		
		ids.push(feature.id);
		if (!feature.properties.millage) {feature.properties.millage = "none";};
		var thisMarker = L.marker(layer.getBounds().getCenter(), {riseOnHover: true}).addTo(map);
		thisMarker.bindPopup(
			h3ParkName(feature.properties), 
			{closeButton: false, maxHeight: 300}
			);
		thisMarker.on("click", function(e) {liPark(e.target.index).scrollIntoView()});
		thisMarker.on("popupopen", function(e) {parkClicked(e, true)});
		thisMarker.on("popupclose", function(e) {parkClicked(e), false});
		thisMarker.park = {
			"name": feature.properties.name, 
			"type": feature.properties.type + " " + feature.properties.leisure,
			"acreage": feature.properties.acreage,
			"pool": feature.properties.pool,
			"millage": feature.properties.millage		
			}
		markers.push(thisMarker);
		}
	}

function h3ParkName(info) {
	return ("<h3>" + info.name + "</h3>");
	}

function liPark(index) {
	return (parklist.getElementsByTagName("li")[index]);
	}

function parkClicked(e, open) {
	var index = e.target.index;
	liPark(index).classList.toggle("highlight");
	if (!open) {
		thisMarker = markers[index];
		thisMarker.setPopupContent(h3ParkName(thisMarker.park));
		}
	}
	
function showFeatures() {
	
	markers.sort(function(a, b){return (a.park.name.toUpperCase() > b.park.name.toUpperCase()) ? 1 : -1;});
	var longTextNeeded = true;
	
	for (i = 0; i < markers.length; i++) {
		
		thisMarker = markers[i];
		thisMarker.index = i;
				
		var li = document.createElement("li");
		var a = document.createElement("a");
		a.href = "javascript:pop(" + i + ");";
		
		var needInfo = false;
		
		var thisPark = JSON.parse(JSON.stringify(thisMarker.park));
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
						needInfo = true
						p.innerHTML = 
							"<a href='#' title='Details of improvements' onclick='moneyClicked(" + i +  ");'>" + thisPark[feature] + "&nbsp;<i class='fa fa-info-circle fa-lg'></i></a>";
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
		
		if (needInfo) {
			thisMarker.park.info = "description of improvements would go here";
			if (longTextNeeded) {
				thisMarker.park.info +=
					", but this can easily be expanded to monster-size to fit a lot more text than can posibly go in one box of this size, run-on sentences and all, in the beginning, etc., and I guess I need to put even more stuff in here to prove my point, eh?";
				longTextNeeded = false;
				}
			}
		
		parklist.appendChild(li);
		
		}  

	}

function moneyClicked(index) {
	thisMarker = markers[index];
	thisMarker.setPopupContent(h3ParkName(thisMarker.park) + thisMarker.park.info);
	pop(index);
	}

function pop(index) {
	var thisMarker = markers[index];
	var where = thisMarker.getLatLng();
	var zoom = map.getZoom();
	if (zoom < 15) {zoom = 15;}
	map.setView(where, zoom, {animation: true});
	thisMarker.openPopup();
	}