loadJSON("https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/parks.geojson", JSONloaded);

function loadJSON(url, callback) {   
	var xobj = new XMLHttpRequest();
	if (xobj.overrideMimeType) {xobj.overrideMimeType("application/json");}
	xobj.open('GET', url, true);
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {callback(xobj.responseText);}
		};
    xobj.send(null);  
 	}
 
function JSONloaded(response) {
	parks = JSON.parse(response);
	getParkFeatures();
	mapParks(); 
	showFeatures();
	}
	
function getParkFeatures() {
	var ids = [];
	ParkFeatures = [];
	for (i = 0; i < parks.features.length; i++) {
		var feature = parks.features[i];
		if (feature.properties && feature.properties.name) {
			if (ids.indexOf(feature.id) == -1) {
				ids.push(feature.id);
				if (!feature.properties.millage) {feature.properties.millage = "none";};
				ParkFeatures.push({
					"name": feature.properties.name, 
					"id": feature.id, 
					"type": feature.properties.type + " " + feature.properties.leisure,
					"acreage": feature.properties.acreage,
					"pool": feature.properties.pool,
					"millage": feature.properties.millage
					});
				}
			}
		}  
	ParkFeatures.sort(function(a, b){return (a.name.toUpperCase() > b.name.toUpperCase()) ? 1 : -1;});
	}

function mapParks() {
	map = L.map("map").setView([42.9612, -85.6557], 12);
	L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
		attribution: 
			"<a target='_blank' href='" +
				"https://www.mapbox.com/about/maps/'>&copy; Mapbox</a> " +
			"<a target='_blank' href='" +
				"http://www.openstreetmap.org/copyright'>&copy; OpenStreetMap</a> " +
			"<a target='_blank' href='" +
				"https://www.mapbox.com/map-feedback/#/-85.596/42.997/14'><b>Improve the underlying map</b></a>",
		minZoom: 11,
		maxZoom: 17,
		id: "github.kedo1cp3",
		accessToken: "pk.eyJ1IjoiZ2l0aHViIiwiYSI6IjEzMDNiZjNlZGQ5Yjg3ZjBkNGZkZWQ3MTIxN2FkODIxIn0.o0lbEdOfJYEOaibweUDlzA"
		}).addTo(map);
	allLayers = L.geoJson(parks, {onEachFeature: makePopup, style: {"color": "#ff7800", "weight": 1, "opacity": 0.65}}).addTo(map);
	}
	
function makePopup(feature, layer) {
	if (feature.properties && feature.properties.name) {
		var pool = function() {
			if (feature.properties.pool) {return "<br />pool: " + feature.properties.pool;}	else {return "";}
			}
		layer.bindPopup(
			"<h3>" + feature.properties.name + "</h3>" +
			"<h4>" + feature.properties.type + " " + feature.properties.leisure + "</h4>" +
			"<p>" + feature.properties.acreage + " acres" + pool() + "</p>" +
			"<p><b>millage: </b>" + feature.properties.millage + "</p>",
			{closeButton: false}
			);
		layer._leaflet_id = feature.id;
		}
	}
	
function showFeatures() {
	for (i = 0; i < ParkFeatures.length; i++) {
		
		// parklist gets names
		var li = document.createElement("li");
		var a = document.createElement("a");
		a.href = "javascript:pop('" + ParkFeatures[i].id + "');";
		a.text = ParkFeatures[i].name;
		li.appendChild(a);
		parklist.appendChild(li);
		
		// grid (table) and tiles get all data
		var tr = document.createElement("tr");
		tr.onclick = function(e) {
			view.value = "map";
			toggle();
			pop(ParkFeatures[e.target.parentNode.rowIndex - 1].id);
			};
		var div = document.createElement("div");

		var feature = JSON.parse(JSON.stringify(ParkFeatures[i]));
		delete feature.id;
		for (f in feature) {
			// for table cells
			var td = document.createElement("td");
			td.textContent = feature[f];
			tr.appendChild(td);
			// for tiles		
			var p = document.createElement("p");
			p.innerHTML = feature[f];
			div.appendChild(p);
			} 

		grid.appendChild(tr);
		maintiles.appendChild(div);
		
		}  
	}

function toggle() {
	main.style.display = "none";
	maingrid.style.display = "none";
	maintiles.style.display = "none";
	switch (view.value) {
		case "map":
			main.style.display = "block";
			break;
		case "grid":
			maingrid.style.display = "block";
			break;
		case "tiles":
			maintiles.style.display = "block";
			break;
		}
	}
		
function pop(id) {
	var thisLayer = allLayers.getLayer(id);
	var where = thisLayer.getBounds().getCenter();
	var zoom = map.getZoom();
	if (zoom < 15) {zoom = 15;};
	map.setView(where, zoom, {animation: true});
	thisLayer.openPopup(where);
	}
