loadJSON("https://raw.githubusercontent.com/friendlycode/gr-parks/gh-pages/parks.geojson", JSONloaded);

function loadJSON(url, callback) {   
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', url, true); // Replace 'my_data' with the path to your file
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {callback(xobj.responseText);}
		};
    xobj.send(null);  
 }
 
function JSONloaded(response) {
	var geojson = JSON.parse(response);
	mapParks(geojson);
	getListofParks(geojson);
	}
	
function getListofParks(geojson) {
	var listofparks = [];
	for (i = 0; i < geojson["features"].length; i++) {
		var feature = geojson.features[i]
		if (feature.properties && feature.properties.name) {
			listofparks.push({"name": feature.properties.name, "id": feature.id});
			}
		}  
	listofparks.sort(function(a, b){return (a.name.toUpperCase() > b.name.toUpperCase()) ? 1 : -1;});
	for (i = 0; i < listofparks.length; i++) {
		//var parkwords = listofparks[i].name.split(" ");
		//if (parkwords[parkwords.length - 1] == "Park") {parkwords.splice(-1,1);};
		//listofparks[i].name = parkwords.join(" ");
		var li = document.createElement("li");
		var a = document.createElement("a");
		a.href = "javascript:clickMap('" + listofparks[i].id + "');";
		a.text = listofparks[i].name;
		li.appendChild(a);
		parklist.appendChild(li);
		}  
	}
	
function mapParks(json) {
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
	allLayers = L.geoJson(json, {onEachFeature: onEachFeature, style: {"color": "#ff7800", "weight": 1, "opacity": 0.65}}).addTo(map);
	}
	
function onEachFeature(feature, layer) {
	if (feature.properties && feature.properties.name) {
		var bounds = layer.getBounds();
		var popup = new L.Popup({closeButton: false});
		popup.setLatLng(bounds.getCenter());
		var pool = function() {
			if (feature.properties.pool) {
				return "<br />pool: " + feature.properties.pool;
				}
			else {
				return "";
				}
			}
		if (!feature.properties.millage) {feature.properties.millage = "none";};
		popup.setContent(
			"<h3>" + feature.properties.name + "</h3>" +
			"<h4>" + feature.properties.type + " " + feature.properties.leisure + "</h4>" +
			"<p>" + feature.properties.acreage + " acres" + pool() + "</p>" +
			"<p><b>millage: </b>" + feature.properties.millage + "</p>"
			);
		layer.bindPopup(popup);
		layer._leaflet_id = feature.id;
		}
	}
	
function clickMap(id) {
	allLayers.getLayer(id).openPopup();
	}
