// Changes the map layer between satellite and street view
function changeMapLayers(icon, streetMapLayer, satelliteLayer) {
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

  // Call the function to fetch the points.
  fetchPointsWeb();

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
  updateMap(); // Call updateMap immediately when the script runs
  window.Map.on("click", addMarkerAndRow); // Call addMarkerAndRow immediately when the script runs
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

// Initialize row index to 0
let rowIdx = 0;

// Create a Map to store markers
let markers = new Map();

// Initialize an array to store the coordinates of the markers
const pointCoordinates = [];

// Define a function to check if a marker already exists at the given coordinates
function markerExists(lat, lng) {
  return Array.from(markers.values()).some((marker) => {
    return marker.getLatLng().lat === lat && marker.getLatLng().lng === lng;
  });
}

// Define a function to add a marker and corresponding row in the table
function addMarkerAndRow(e, id) {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  // Log the coordinates where the marker is being added
  console.log("Adding marker and row:", { lat, lng });

  // Check if a marker already exists at these coordinates
  if (markerExists(lat, lng)) {
    alert("You cannot add multiple markers at the same location.");
    return;
  }

  // Define the ID for the new row
  const rowId = `R${rowIdx + 1}`;

  // Create a new marker at the clicked location
  const marker = L.circleMarker([lat, lng], {
    color: "red",
    radius: 5,
    draggable: false,
  }).addTo(window.Map);

  // Bind a popup to the marker to show its ID and coordinates
  marker.bindPopup(`ID: ${id}<br>Lat: ${lat}<br>Lng: ${lng}`);

  // Add the marker to the markers Map
  markers.set(rowId, marker);

  // Add the coordinates of the new marker to the array
  pointCoordinates.push([lat, lng]);

  // If there are at least two markers, draw a line between them
  if (pointCoordinates.length >= 2) {
    if (window.polyline) {
      window.Map.removeLayer(window.polyline);
    }

    const lineCoordinates = [...pointCoordinates];

    // If there are more than two markers, connect the last marker to the first to form a closed loop
    if (pointCoordinates.length > 2) {
      lineCoordinates.push(pointCoordinates[0]);
    }

    // Draw the line on the map
    window.polyline = L.polyline(lineCoordinates, {
      color: "red",
    }).addTo(window.Map);
  }

  // Add a row to the table for the new marker
  $("#tbody").append(`
    <tr id="${rowId}">
        <td class="row-index text-center">
            <p>${id || rowIdx + 1}</p>
        </td>
        <td>
            <input type="float" class="text-center container-fluid" id="latitude_${
              rowIdx + 1
            }" value="${lat.toFixed(6)}" name="latitude-${rowIdx + 1}">
        </td>
        <td>
            <input type="float" class="text-center container-fluid" id="longitude_${
              rowIdx + 1
            }" value="${lng.toFixed(6)}" name="Longitude-${rowIdx + 1}">
        </td>
        <td class="text-center">
            <button class="btn btn-danger remove" type="button" data-row-id="${rowId}">Remove</button>
        </td>
    </tr>
  `);

  // Increase the row index
  rowIdx++;
}

// Add an event listener to the remove buttons
$("#tbody").on("click", ".remove", function () {
  // Get the ID of the row to be removed
  const rowId = $(this).attr("data-row-id");

  // Get the marker corresponding to this row
  const marker = markers.get(rowId);

  // If the marker exists, remove it
  if (marker && marker instanceof L.Layer) {
    marker.remove();
    markers.delete(rowId);

    // Find the index of this marker in the array
    const markerIndex = pointCoordinates.findIndex(
      (coord) =>
        coord[0] === marker.getLatLng().lat &&
        coord[1] === marker.getLatLng().lng
    );

    // If the marker was found in the array, remove it
    if (markerIndex !== -1) {
      pointCoordinates.splice(markerIndex, 1);
    }

    // Update the lines on the map
    updatePolylines();
  }

  // Remove the corresponding row from the table
  $(this).closest("tr").remove();

  // Decrease the row index
  rowIdx--;

  // Update the IDs and displayed indices of the remaining rows
  $("#tbody tr").each(function (index) {
    $(this).attr("id", `R${index + 1}`);
    $(this)
      .find(".row-index p")
      .text(index + 1);
  });
});

// Define a function to update the lines when a marker is removed
function updatePolylines() {
  // If the map is not initialized, log an error and return
  if (!window.Map) {
    console.error("Map is not initialized.");
    return;
  }

  // Remove all lines from the map
  window.Map.eachLayer(function (layer) {
    if (
      layer &&
      layer instanceof L.Polyline &&
      !(layer instanceof L.CircleMarker)
    ) {
      window.Map.removeLayer(layer);
    }
  });

  // If there are at least two markers left, draw a line between them
  if (pointCoordinates.length >= 2) {
    if (window.polyline) {
      window.Map.removeLayer(window.polyline);
    }

    const lineCoordinates = [...pointCoordinates];

    // If there are more than two markers, connect the last marker to the first to form a closed loop
    if (pointCoordinates.length > 2) {
      lineCoordinates.push(pointCoordinates[0]);
    }

    // Draw the line on the map
    window.polyline = L.polyline(lineCoordinates, {
      color: "red",
    }).addTo(window.Map);
  }
}

// Add an event listener to the submit button
$("#submitBtn").on("click", function () {
  // Disable the submit button and change its color to green
  $("#submitBtn")
    .prop("disabled", true)
    .removeClass("btn-primary btn-danger")
    .addClass("btn-success");

  // Initialize an array to store the data to be submitted
  const data = [];

  // Add the data from each row to the array
  $("#tbody tr").each(function () {
    const row = $(this);
    const zone = row.find(".row-index p").text();
    const latitude = row.find("input[name^='latitude-']").val();
    const longitude = row.find("input[name^='Longitude-']").val();
    data.push({ zone, latitude, longitude });
  });

  // Send the data to the server
  $.ajax({
    url: window.location.href,
    method: "POST",
    data: JSON.stringify(data),
    contentType: "application/json",
    headers: {
      "X-CSRFToken": "{{ csrf_token }}",
    },
    success: function (response) {
      // If the submission was successful, show an alert and return
      if (response.status === "success") {
        alert("Data submitted successfully!");
      } else {
        // If there was an error, show an alert and change the color of the submit button to red
        alert("Error submitting data.");
        $("#submitBtn")
          .removeClass("btn-primary btn-success")
          .addClass("btn-danger");
      }
    },
    error: function () {
      // If there was an error, show an alert and change the color of the submit button to red
      alert("Error submitting data.");
      $("#submitBtn")
        .removeClass("btn-primary btn-success")
        .addClass("btn-danger");
    },
    complete: function () {
      // After a delay, re-enable the submit button and change its color back to blue
      setTimeout(function () {
        $("#submitBtn")
          .prop("disabled", false)
          .removeClass("btn-success btn-danger")
          .addClass("btn-primary");
      }, 3000);
    },
  });
});

// Add an event listener to the remove buttons to re-enable the submit button when a row is removed
$("#tbody").on("click", ".remove", function () {
  $("#submitBtn")
    .prop("disabled", false)
    .removeClass("btn-success btn-danger")
    .addClass("btn-primary");
});

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
let polyline = null;

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

        // If the polyline has returned to the start, clear the array and remove the polyline.
        if (
          polylinePoints.length > 0 &&
          polylinePoints[0][0] === newPoint[0] &&
          polylinePoints[0][1] === newPoint[1]
        ) {
          polylinePoints = [];
          window.Map.removeLayer(polyline);
          polyline = null;
        }
        // Add the new point to the polyline points array.
        polylinePoints.push(newPoint);

        // If a polyline does not exist, create it.
        if (!polyline) {
          polyline = L.polyline(polylinePoints, { color: "blue" }).addTo(
            window.Map
          );
        } else {
          // Update the polyline with the new points.
          polyline.setLatLngs(polylinePoints);
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
          window.Map.setView(newPoint, 18);
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

function fetchPointsWeb() {
  fetch("/get_points_web/")
    .then((response) => response.json())
    .then((data) => {
      const coordinates = data.coordinates.split("/").map((coordStr) => {
        const [lat, lng] = coordStr.split(",");
        return [parseFloat(lat), parseFloat(lng)];
      });

      // Now `coordinates` is an array of [lat, lng] pairs.
      // You can use this data to add markers, draw lines, etc.
      coordinates.forEach((coord, index) => {
        // Create a pseudo-event object to pass to addMarkerAndRow
        const pseudoEvent = { latlng: { lat: coord[0], lng: coord[1] } };
        // Use index + 1 as the ID for each marker
        addMarkerAndRow(pseudoEvent, index + 1);
      });
    })
    .catch((error) => console.error("Error fetching points:", error));
}
