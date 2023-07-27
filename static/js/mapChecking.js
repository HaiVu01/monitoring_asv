function changeMapLayers(icon, streetMapLayer, satelliteLayer) {
  // Check if window.Map is a Leaflet map instance
  if (window.Map instanceof L.Map) {
    // Check if the current layer is street map
    if (window.Map.hasLayer(streetMapLayer)) {
      // If true, remove street map layer and add satellite layer
      window.Map.removeLayer(streetMapLayer);
      window.Map.addLayer(satelliteLayer);
      // Change the icon to globe
      icon.className = "fa fa-globe";
    } else {
      // If the current layer is not street map (i.e., it's satellite),
      // remove satellite layer and add street map layer
      window.Map.removeLayer(satelliteLayer);
      window.Map.addLayer(streetMapLayer);
      // Change the icon to map marker
      icon.className = "fa fa-map-marker";
    }
  } else {
    // If window.Map is not a Leaflet map instance, throw an error or log a message
    console.error("window.Map is not a Leaflet map instance");
  }
}

// Initializes the map
function initMap() {
  // Create a new map instance and set the initial view
  window.Map = L.map("map").setView([51.505, -0.09], 13);

  // Create the satellite layer
  var satelliteLayer = L.tileLayer(
    "http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    {
      maxNativeZoom: 19,
      maxZoom: 25,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }
  );

  // Create the street map layer
  var streetMapLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxNativeZoom: 19,
      maxZoom: 25,
    }
  );

  // Adding satellite layer to the map initially
  streetMapLayer.addTo(window.Map);

  // Create a control to switch between layers
  var customControl = L.Control.extend({
    options: {
      position: "bottomleft",
    },
    onAdd: function (map) {
      var changeButton = L.DomUtil.create(
        "div",
        "leaflet-bar leaflet-control leaflet-control-custom"
      );

      // Set initial icon to globe as we are starting with satellite layer
      var icon = L.DomUtil.create("i", "fa fa-globe", changeButton);

      // Change layers on button click
      L.DomEvent.on(changeButton, "click", function (e) {
        changeMapLayers(icon, streetMapLayer, satelliteLayer);
      });

      L.DomEvent.disableClickPropagation(changeButton);
      L.DomEvent.disableScrollPropagation(changeButton);

      return changeButton;
    },
  });

  //Adding control layers button
  window.Map.addControl(new customControl());

  //Adding center button
  const centerButtonControl = createCenterButtonControl();
  centerButtonControl.addTo(window.Map);
}

document.addEventListener("DOMContentLoaded", initMap);

// Center the map on the latest marker
function centerOnLatestMarker() {
  if (window.circleMarker) {
    window.Map.setView(window.circleMarker.getLatLng(), 19);
  }
}
function centerOnLatestMarker() {
  // If there's a latest point, set the view to this point
  if (latestPoint) {
    window.Map.setView(latestPoint, 18);
  }
}

// Create a control button to center the map on the latest marker
function createCenterButtonControl() {
  const centerButtonControl = L.Control.extend({
    options: {
      position: "topright",
    },
    onAdd: function (map) {
      const button = L.DomUtil.create("button", "center-button");
      button.innerHTML = '<i class="fas fa-home"></i>';
      L.DomEvent.addListener(button, "click", centerOnLatestMarker);
      L.DomEvent.disableClickPropagation(button);
      return button;
    },
  });
  return new centerButtonControl();
}

// Function to fetch points from the backend and add them to the map
function fetchPointsAndAddMarkers() {
  // Array to store the coordinates of all points
  var pointCoordinates = [];

  // Send a GET request to the backend
  $.get("/get_points_web/", function (response) {
    // Parse the coordinates string from the response
    const coordinates = response.coordinates
      .split("/")
      .map((pair) => pair.split(",").map(Number));

    // For each pair of coordinates, create a marker and add it to the map
    for (let i = 0; i < coordinates.length; i++) {
      const lat = coordinates[i][0];
      const lng = coordinates[i][1];

      // Create a new marker at the fetched location
      const marker = L.circleMarker([lat, lng], {
        color: "red",
        radius: 5,
        draggable: false,
      }).addTo(window.Map);

      // Bind a popup to the marker to show its coordinates
      marker.bindPopup(`Lat: ${lat}<br>Lng: ${lng}`);

      // Add the coordinates of the new marker to the array
      pointCoordinates.push([lat, lng]);
    }

    // If there are at least two markers, draw a line between them
    if (pointCoordinates.length >= 2) {
      const polyline = L.polyline(pointCoordinates, {
        color: "red",
      }).addTo(window.Map);
    }
  });
}

// Call the function to fetch the points and add the markers
fetchPointsAndAddMarkers();

// Define necessary variables outside the functions
let circleMarker; // The current circle marker on the map
let blinkInterval; // To keep track of the current blinking interval

// Function to make a circle marker blink between two colors
function blinkCircleMarker(circleMarker) {
  let visible = true; // Boolean to switch between visible and invisible states
  clearInterval(blinkInterval); // Clear the previous blinking interval

  // Set a new blinking interval
  blinkInterval = setInterval(() => {
    visible = !visible; // Switch between visible and invisible states
    // Change the style of the circle marker depending on the visible state
    if (visible) {
      circleMarker.setStyle({ fillColor: "#1E90FF", fillOpacity: 0.5 });
    } else {
      circleMarker.setStyle({ fillColor: "#0000FF", fillOpacity: 0.5 });
    }
  }, 500); // Blink every 500 milliseconds
}

let isFirstLoad = true; // declare and initialize the flag before the function
let latestPoint = null; // variable to store the latest point

// Create an array to store the points for the polyline.
let polylinePoints = [];

// Define the polyline object.
let polilineASV = null;

// Define the function that will update the map.
function updateMap() {
  // Send a GET request to the /get_location_ASV/ endpoint.
  return (
    fetch("/get_location_ASV/")
      .then((response) => response.json()) // Parse the response as JSON.
      .then((location) => {
        // Log the received location data to the console.
        console.log("Location:", location);

        // Define the new point using the received latitude and longitude.
        const newPoint = [location.latitude, location.longitude];
        latestPoint = newPoint; // Update the latest point

        // If the polilineASV has returned to the start, clear the array and remove the polilineASV.
        if (
          polylinePoints.length > 0 &&
          polylinePoints[0][0] === newPoint[0] &&
          polylinePoints[0][1] === newPoint[1]
        ) {
          polylinePoints = [];
          window.Map.removeLayer(polilineASV);
          polilineASV = null;
        }
        // Add the new point to the polyline points array.
        polylinePoints.push(newPoint);

        // If a polilineASV does not exist, create it.
        if (!polilineASV) {
          polilineASV = L.polyline(polylinePoints, { color: "blue" }).addTo(
            window.Map
          );
        } else {
          // Update the polilineASV with the new points.
          polilineASV.setLatLngs(polylinePoints);
        }

        // If a circleMarker already exists, remove it.
        if (circleMarker) {
          circleMarker.remove();
        }

        // Add a new circleMarker at the new point.
        circleMarker = L.circleMarker(newPoint, {
          color: "white",
          fillColor: "#1E90FF",
          fillOpacity: 0.5,
          radius: 10,
        }).addTo(window.Map); // Add the circleMarker to the map.

        // Bind a popup to the circleMarker displaying the data received from the server.
        circleMarker.bindPopup(
          `Humidity: ${location.humidity}<br>` +
            `Temperature: ${location.temperature}<br>` +
            `Dissolved Oxygen: ${location.dissolvedOxygen}<br>` +
            `Air Pressure: ${location.airPressure}<br>` +
            `Timestamp: ${location.created_at}`
        );

        // Call the blinkCircleMarker function with the new circleMarker.
        blinkCircleMarker(circleMarker);
        if (isFirstLoad) {
          // Set the view to the new point with a zoom level of 13
          window.Map.setView(newPoint, 23);
          isFirstLoad = false; // update the flag after the first load
        }
      })
      // If there's an error in the Promise chain, log it to the console.
      .catch((error) => console.error("Error fetching location data:", error))
  );
}

// Call the updateMap function once to initialize the map.
updateMap();

// Then call the updateMap function every 1000 ms (1 second) to keep the map up-to-date.
setInterval(updateMap, 1000);

// Initialize last latitude and longitude
let lastLat = null;
let lastLon = null;

// Function to fetch data from /get_location_ASV/
function fetchData() {
  fetch("/get_location_ASV/")
    .then((response) => response.json())
    .then((data) => {
      // If the latitude and longitude haven't changed, don't update the table
      if (data.latitude === lastLat && data.longitude === lastLon) return;

      // Otherwise, update the last latitude and longitude
      lastLat = data.latitude;
      lastLon = data.longitude;

      // And add the new data to the table
      const table = document.getElementById("tbody");
      const row = table.insertRow(0);
      const idCell = row.insertCell(0);
      const latCell = row.insertCell(1);
      const lonCell = row.insertCell(2);
      idCell.textContent = table.rows.length; // Update ID
      latCell.textContent = data.latitude;
      lonCell.textContent = data.longitude;
    })
    .catch((err) => console.error(err));
}

// Fetch data every second
setInterval(fetchData, 1000);

let lastZoneData = null;
let lastDistanceData = null;

function fetchZoneData() {
  Promise.all([
    fetch("/get_points_web/").then((response) => response.json()),
    fetch("/get_distances/").then((response) => response.json()),
  ])
    .then(([zoneData, distanceData]) => {
      if (
        zoneData.coordinates === lastZoneData &&
        JSON.stringify(distanceData.distances) === lastDistanceData
      )
        return;

      lastZoneData = zoneData.coordinates;
      lastDistanceData = JSON.stringify(distanceData.distances);

      const zoneTable = document.getElementById("zoneTable");
      const zonePoints = zoneData.coordinates.split("/");

      zoneTable.innerHTML = ""; // Clear the table before adding new data
      zonePoints.forEach((pair, index) => {
        const row = zoneTable.insertRow(0);
        const zoneCell = row.insertCell(0);
        const latCell = row.insertCell(1);
        const lonCell = row.insertCell(2);
        const errorCell = row.insertCell(3);
        const [lat, lon] = pair.split(",");
        zoneCell.textContent = index + 1;
        latCell.textContent = lat;
        lonCell.textContent = lon;
        const distance = parseFloat(distanceData.distances[index]);
        if (!isNaN(distance)) {
          errorCell.textContent = distance.toFixed(3) + " (m)";
        } else {
          errorCell.textContent = "Invalid data";
        }
      });
    })
    .catch((err) => console.error("Error fetching data:", err));
}

// Fetch zone data every second
setInterval(fetchZoneData, 1000);
