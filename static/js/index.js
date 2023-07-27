// Progress bar for display water parameters real-time
// Define circle progress bar options
let options = {
  startAngle: -1.55,
  size: 150,
  fill: {
    color: "red",
  },
  value: 0.0, // Add default value
};

// Function that handles progress bar animation updates
function onCircleAnimationProgress(unit, maxValue) {
  return function (event, progress, stepValue) {
    const value = maxValue * stepValue;
    // Update the text in the parent element of the circle progress bar
    $(this)
      .parent()
      .find("span")
      .text(String(value.toFixed(0)) + unit);
  };
}

// Setup circle progress bars for temperature, humidity, dissolved oxygen and pressure
$(".temp .circle .bar")
  .circleProgress(options)
  .on("circle-animation-progress", onCircleAnimationProgress("°C", 40));
$(".hum .circle .bar")
  .circleProgress(options)
  .on("circle-animation-progress", onCircleAnimationProgress("%", 100));
$(".do .circle .bar")
  .circleProgress(options)
  .on("circle-animation-progress", onCircleAnimationProgress("mg/l", 20));
$(".press .circle .bar")
  .circleProgress(options)
  .on("circle-animation-progress", onCircleAnimationProgress("mb", 2000));

// Function to fetch latest sensor data and update progress bars
function updateSensorData() {
  fetch("/get_latest_sensor_data/")
    .then((response) => response.json())
    .then((data) => {
      if (!data) {
        console.error("No data received from the server.");
        return;
      }

      // Normalize sensor data values for progress bar update
      const temperatureNormalized = data.temperature / 40;
      const humidityNormalized = data.humidity / 100;
      const pressureNormalized = data.pressure / 2000;
      const dissolvedOxygenNormalized = data.dissolvedOxygen / 20;

      // Determine color for each progress bar based on sensor values
      const temperatureColor =
        data.temperature >= 18 && data.temperature <= 33 ? "green" : "red";
      const humidityColor =
        data.humidity >= 40 && data.humidity <= 70 ? "green" : "red";
      const dissolvedOxygenColor = data.dissolved_oxygen > 5 ? "green" : "red";
      const pressureColor = "green";

      // Update progress bars with new values and color
      $(".temp .circle .bar").circleProgress(
        "value",
        temperatureNormalized,
        true
      );
      $(".hum .circle .bar").circleProgress("value", humidityNormalized, true);
      $(".do .circle .bar").circleProgress(
        "value",
        dissolvedOxygenNormalized,
        true
      );
      $(".press .circle .bar").circleProgress(
        "value",
        pressureNormalized,
        true
      );
      $(".temp .circle .bar").circleProgress({
        animation: { duration: 1000 },
        fill: { color: temperatureColor },
      });
      $(".hum .circle .bar").circleProgress({
        animation: { duration: 1000 },
        fill: { color: humidityColor },
      });
      $(".do .circle .bar").circleProgress({
        animation: { duration: 1000 },
        fill: { color: dissolvedOxygenColor },
      });
      $(".press .circle .bar").circleProgress({
        animation: { duration: 1000 },
        fill: { color: pressureColor },
      });
    })
    .catch((error) => console.error("Error fetching sensor data:", error));
}

// Fetch and display sensor data on page load
updateSensorData();

// Keep updating sensor data every 5 seconds
setInterval(updateSensorData, 5000);

// Open street map for display locations of ASV and Route of ASV
// Function to change between street map and satellite map layers
function changeMapLayers(icon, streetMapLayer, satelliteLayer) {
  if (window.map.hasLayer(streetMapLayer)) {
    window.map.removeLayer(streetMapLayer);
    window.map.addLayer(satelliteLayer);
    icon.className = "fa fa-globe";
  } else {
    window.map.removeLayer(satelliteLayer);
    window.map.addLayer(streetMapLayer);
    icon.className = "fa fa-map-marker";
  }
}

// Function to initialize the map
function initMap() {
  window.map = L.map("map").setView([0, 0], 17);

  var satelliteLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxNativeZoom: 19,
      maxZoom: 25,
    }
  );

  var streetMapLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxNativeZoom: 19,
      maxZoom: 25,
    }
  );
  streetMapLayer.addTo(window.map);

  var customControl = L.Control.extend({
    options: {
      position: "bottomleft",
    },
    onAdd: function (map) {
      var changeButton = L.DomUtil.create(
        "div",
        "leaflet-bar leaflet-control leaflet-control-custom"
      );

      var icon = L.DomUtil.create("i", "fa fa-map-marker", changeButton);

      L.DomEvent.on(changeButton, "click", function (e) {
        changeMapLayers(icon, streetMapLayer, satelliteLayer);
      });

      L.DomEvent.disableClickPropagation(changeButton);
      L.DomEvent.disableScrollPropagation(changeButton);

      return changeButton;
    },
  });
  window.map.addControl(new customControl());

  const centerButtonControl = createCenterButtonControl();
  centerButtonControl.addTo(window.map);
}

// Function to center on latest marker
function centerOnLatestMarker() {
  if (window.circleMarker && window.map.hasLayer(window.circleMarker)) {
    window.map.setView(window.circleMarker.getLatLng(), 19);
  } else {
    console.log("No marker to center on.");
  }
}
// Function to create center button control
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

document.addEventListener("DOMContentLoaded", initMap);
