loadJSON("https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/gr.geojson", loadedGR);

function loadJSON(url, callback) {   
	var xobj = new XMLHttpRequest();
	if (xobj.overrideMimeType) {xobj.overrideMimeType("application/json");}
	xobj.open('GET', url, true);
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {callback(xobj.responseText);}
		};
    xobj.send(null);  
 	}
 
function loadedGR(response) {
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
	loadJSON("https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/parks.geojson", loadedParks);
	}
	
function loadedParks(response) {
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
		var thisMarker = L.marker(layer.getBounds().getCenter(), {riseOnHover: true}).addTo(map);
		thisMarker.bindPopup("<h3>" + feature.properties.name + "</h3>", {closeButton: false});
		thisMarker.on("click", function(e) {liPark(e.target.index).scrollIntoView()});
		thisMarker.on("popupopen", function(e) {clickPark(e)});
		thisMarker.on("popupclose", function(e) {clickPark(e)});
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

function liPark(index) {
	return (parklist.getElementsByTagName("li")[index]);
	}

function clickPark(e) {
	var index = e.target.index;
	var li = liPark(index);
	if (li.classList.contains("highlight")) {
		li.classList.remove("highlight");
		// todo: make a function for this second line ("contains", etc.)
		var a = li.firstElementChild.getElementsByTagName("a");
		if (a.length !=0 && a[0].firstElementChild.classList.contains("hide")) {clickMoney(index);}
		}
	else {
		li.classList.add("highlight");
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
		
		var details = false;
		
		var thisPark = JSON.parse(JSON.stringify(thisMarker.park));
		for (feature in thisPark) {
			var p = document.createElement("p");
			switch (feature) {
				case "acreage":
					p.textContent = thisPark[feature] + " acres";
					break;
				case "millage":
					if (thisPark[feature] == "none") {
						p.textContent = "";
						} 
					else {
						details = true
						p.innerHTML = 
							"<a href='#' title='Details of improvements' onclick='clickMoney(" + i +  ");'>" + thisPark[feature] + "&nbsp;<i class='fa fa-caret-down'></i><i class='fa fa-caret-up hide'></i></a>";
						;}
					break;
				case "pool":
					p.textContent = thisPark[feature];
					if (thisPark[feature] == "") {p.innerHTML = "&nbsp;";} else {p.textContent += " pool";}
					break;
				default:
					p.textContent = thisPark[feature];
				}
			a.appendChild(p);
			} 
		li.appendChild(a);
		
		if (details) {
			var accordion = document.createElement("div");
			accordion.className = "accordion";
			accordion.textContent = "description of improvements would go here";
			if (longTextNeeded) {
				accordion.textContent +=
					", but this can easily be expanded to monster-size to fit a lot more text than can posibly go in one box of this size, run-on sentences and all, in the beginning, etc., and I guess I need to put even more stuff in here to prove my point, eh?";
				longTextNeeded = false;
				}
			li.appendChild(accordion);
			}
		
		parklist.appendChild(li);
		
		}  
	}

function clickMoney(index) {
	var li = liPark(index);
	var a = li.firstElementChild.getElementsByTagName("a")[0];
	a.firstElementChild.classList.toggle("hide");
	a.lastElementChild.classList.toggle("hide");
	var accordion = li.lastElementChild;
	if (a.firstElementChild.classList.contains("hide")) {
		accordion.classList.add("show");
		pop(index);
		}
	else {
		accordion.classList.remove("show");
		}
	}

function pop(index) {
	var thisMarker = markers[index];
	var where = thisMarker.getLatLng();
	var zoom = map.getZoom();
	if (zoom < 15) {zoom = 15;}
	map.setView(where, zoom, {animation: true});
	thisMarker.openPopup();
	}