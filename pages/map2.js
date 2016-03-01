loadJSON("https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/gr.geojson", GRloaded);

function loadJSON(url, callback) {   
	var xobj = new XMLHttpRequest();
	if (xobj.overrideMimeType) {xobj.overrideMimeType("application/json");}
	xobj.open('GET', url, true);
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {callback(xobj.responseText);}
		};
    xobj.send(null);  
 	}
 
function GRloaded(response) {
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
	L.geoJson(city, {style: {color: "yellow", weight: 1, clickable: false}}).addTo(map);
	loadJSON("https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/parks.geojson", JSONloaded);
	}
	
function JSONloaded(response) {
	parks = JSON.parse(response);
	ids = [];
	markers = [];
	L.geoJson(parks, {onEachFeature: getFeature, style: {color: "#ff7800", weight: 1, opacity: 0.65, clickable: false}}).addTo(map);
	parks = undefined;
	ids = undefined;
	showFeatures();
	}

function getFeature(feature, layer) {
	if (ids.indexOf(feature.id) == -1 && feature.properties && feature.properties.name) {		
		ids.push(feature.id);
		if (!feature.properties.millage) {feature.properties.millage = "none";};
		var pool = function() {
			if (feature.properties.pool) {return "<br />pool: " + feature.properties.pool;}	else {return "";}
			}
		var thisMarker = L.marker(
			layer.getBounds().getCenter(), {
				riseOnHover: true//,
//				icon: L.divIcon({
//					className: "mapIcon",
//					iconAnchor: [15, 36],
//					popupAnchor: [0, -36],
//					html: "<i class='fa fa-tree fa-3x'></i>"
//					})	
			}).addTo(map);
		thisMarker.bindPopup("<h3>" + feature.properties.name + "</h3>", {closeButton: false});
		thisMarker.on("click", function(e) {getLI(e).scrollIntoView()});
		thisMarker.on("popupopen", function(e) {toggleParkHighlight(e)});
		thisMarker.on("popupclose", function(e) {toggleParkHighlight(e)});
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

function toggleParkHighlight(e) {
	getLI(e).classList.toggle("highlight");
	}
	
function getLI(e) {
	return (parklist.getElementsByTagName("li")[e.target.index]);
	}

function showFeatures() {
	markers.sort(function(a, b){return (a.park.name.toUpperCase() > b.park.name.toUpperCase()) ? 1 : -1;});
	var longTextNeeded = true;
	for (i = 0; i < markers.length; i++) {
		
		thisMarker = markers[i];
		thisMarker.index = i;
				
		var li = document.createElement("li");
		var a = newMapPopupLink(i);
		
		var tile = document.createElement("div");
		tile.className = "info";
		
		var flipperNeeded = false;
		
		var thisPark = JSON.parse(JSON.stringify(thisMarker.park));
		for (feature in thisPark) {
			var p = document.createElement("p");
			p.textContent = thisPark[feature];
			switch (feature) {
				case "acreage":
					p.textContent += " acres";
					break;
				case "millage":
					if (thisPark[feature] == "none") {p.textContent = "";} else {flipperNeeded = true;}
					break;
				case "pool":
					if (thisPark[feature] == "") {p.innerHTML = "&nbsp;";} else {p.textContent += " pool";}
					break;
				}
			tile.appendChild(p);
			} 
		
		if (flipperNeeded) {
			var flipper = document.createElement("div");
			var back = document.createElement("div");
			flipper.className = "flipper";
			flipper.title = "Click to flip";
			flipper.onclick = function(e) {
				var tag = e.target.tagName.toLowerCase();
				if ((tag != "a") && (tag != "i")) {this.classList.toggle("flip");}
				}
			back.className = "back";
			back.textContent = "description of improvements would go here";
			if (longTextNeeded) {
				back.textContent += ", but this can easily be expanded to monster-size to fit a lot more text than can posibly go in one box of this size, run-on sentences and all, in the beginning, etc., and I guess I need to put even more stuff in here to prove my point, eh?";
				longTextNeeded = false;
				}
			tile.classList.toggle("front");
			flipper.appendChild(tile);
			flipper.appendChild(back);
			a.appendChild(flipper);
			}
		else {
			a.appendChild(tile);
			}
		
		li.appendChild(a);
		parklist.appendChild(li);
		
		}  
	}

function newMapPopupLink(i) {
	var a = document.createElement("a");
	a.href = "javascript:pop('" + i + "');";
	return a;
	}

function pop(index) {
	var thisMarker = markers[index];
	var where = thisMarker.getLatLng();
	var zoom = map.getZoom();
	if (zoom < 15) {zoom = 15;};
	map.setView(where, zoom, {animation: true});
	thisMarker.openPopup();
	}