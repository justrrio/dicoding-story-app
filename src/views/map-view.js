class MapView {
  constructor() {
    this.app = document.getElementById("app-container");
    this.map = null;
    this.markers = [];
  }
  render(stories = []) {
    console.log("MapView.render() called with", stories.length, "stories");

    // Add a loading indicator first
    this.app.innerHTML = `
      <section class="container">
        <h2><i class="fas fa-map-marked-alt"></i> Stories Map</h2>
        <div id="map-loading" class="alert">Loading map...</div>
        <div class="map-container">
          <div id="stories-map" style="height: 600px; width: 100%;"></div>
        </div>
        <div class="map-legend">
          <p><strong>Total Stories with Location:</strong> <span id="stories-count">${
            stories.filter((s) => s.lat && s.lon).length
          }</span></p>
          <p class="map-info">Click on any marker to see the story details</p>
        </div>
      </section>
    `;

    // Make sure the map container is visible
    const mapContainer = document.querySelector(".map-container");
    if (mapContainer) {
      mapContainer.style.display = "block";
    }

    // Longer timeout to ensure DOM is fully rendered
    setTimeout(() => {
      this._initializeMap(stories);
      const loadingEl = document.getElementById("map-loading");
      if (loadingEl) loadingEl.style.display = "none";
    }, 1000);
  }
  _initializeMap(stories) {
    try {
      console.log("Initializing map with", stories.length, "stories");

      // Check if the map container exists
      const mapElement = document.getElementById("stories-map");
      if (!mapElement) {
        console.error("Map container element #stories-map not found!");
        return;
      }

      // Make sure the map element is visible and has dimensions
      mapElement.style.display = "block";
      const rect = mapElement.getBoundingClientRect();
      console.log("Map container dimensions:", rect.width, "x", rect.height);

      if (rect.width === 0 || rect.height === 0) {
        console.warn(
          "Map container has zero dimensions, setting explicit size"
        );
        mapElement.style.width = "100%";
        mapElement.style.height = "600px";
      }

      // Check if Leaflet is loaded
      if (typeof L === "undefined") {
        console.error("Leaflet library not loaded");
        mapElement.innerHTML =
          '<div class="alert alert-danger">Map library failed to load. Please refresh the page.</div>';
        return;
      }

      // Clear previous instance if any
      if (this.map) {
        console.log("Cleaning up previous map instance");
        this.map.remove();
        this.map = null;
      }

      // Initialize map with options that ensure it displays even if container is initially hidden
      console.log("Creating new map instance");
      this.map = L.map("stories-map", {
        center: [-2.5, 118], // Center on Indonesia
        zoom: 5,
        scrollWheelZoom: true,
        zoomControl: true,
        preferCanvas: true,
      });

      // Force a repaint of the container
      mapElement.style.opacity = "0.99";
      setTimeout(() => {
        mapElement.style.opacity = "1";
      }, 0);

      console.log("Map object created successfully");

      // Base layers
      const osmLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      );

      // Add more layer options
      const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 19,
        }
      );

      const darkLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      );

      const baseMaps = {
        OpenStreetMap: osmLayer,
        Satellite: satelliteLayer,
        "Dark Mode": darkLayer,
      };

      // Set default layer
      osmLayer.addTo(this.map);

      // Add layer control
      L.control.layers(baseMaps).addTo(this.map);

      // Add markers for stories with location
      this._addStoryMarkers(stories);
      // Force a map refresh
      setTimeout(() => {
        console.log("Invalidating map size");
        this.map.invalidateSize(true);

        // Add a retry mechanism to make sure the map renders correctly
        this._ensureMapIsRendered();
      }, 300);
    } catch (error) {
      console.error("Error in _initializeMap:", error);
      const mapElement = document.getElementById("stories-map");
      if (mapElement) {
        mapElement.innerHTML =
          '<div class="alert alert-danger">An error occurred while initializing the map. Please refresh the page.</div>';
      }
    }
  }

  _addStoryMarkers(stories) {
    try {
      // Clear existing markers
      if (this.markers && this.markers.length) {
        this.markers.forEach((marker) => {
          if (this.map) this.map.removeLayer(marker);
        });
      }
      this.markers = [];

      // Add markers for stories with location
      stories.forEach((story) => {
        if (story.lat && story.lon) {
          try {
            const marker = L.marker([story.lat, story.lon]).addTo(this.map)
              .bindPopup(`
                <div class="map-popup">
                  <h3>${story.name}</h3>
                  <img src="${story.photoUrl}" alt="Photo by ${
              story.name
            }" style="width: 100%; max-height: 120px; object-fit: cover;">
                  <p>${this._truncateDescription(story.description)}</p>
                  <a href="#/story/${
                    story.id
                  }" class="btn btn-small">View Details</a>
                </div>
              `);

            this.markers.push(marker);
          } catch (markerError) {
            console.error(
              "Error creating marker for story:",
              story.id,
              markerError
            );
          }
        }
      });

      console.log(`Added ${this.markers.length} markers to the map`);
    } catch (error) {
      console.error("Error in _addStoryMarkers:", error);
    }
  }

  _truncateDescription(description, maxLength = 50) {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";

    // Base layers
    const osmLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    );

    // Add more layer options
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        maxZoom: 19,
      }
    );

    const darkLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    );

    const baseMaps = {
      OpenStreetMap: osmLayer,
      Satellite: satelliteLayer,
      "Dark Mode": darkLayer,
    };

    // Set default layer
    osmLayer.addTo(this.map);

    // Add layer control
    L.control.layers(baseMaps).addTo(this.map);

    // Add markers for stories with location
    this._addStoryMarkers(stories);
  }

  _addStoryMarkers(stories) {
    // Clear existing markers
    this.markers.forEach((marker) => this.map.removeLayer(marker));
    this.markers = [];

    // Add markers for stories with location
    stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(this.map)
          .bindPopup(`
            <div class="map-popup">
              <h3>${story.name}</h3>
              <img src="${story.photoUrl}" alt="Photo by ${
          story.name
        }" style="width: 100%; max-height: 120px; object-fit: cover;">
              <p>${this._truncateDescription(story.description)}</p>
              <a href="#/story/${
                story.id
              }" class="btn btn-small">View Details</a>
            </div>
          `);

        this.markers.push(marker);
      }
    });
  }
  _truncateDescription(description, maxLength = 50) {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  }

  _ensureMapIsRendered() {
    // This is a safety mechanism to make sure the map renders correctly
    // It will check if the map tiles are visible, and if not, try to redraw the map
    if (!this.map) return;

    const mapContainer = document.getElementById("stories-map");
    if (!mapContainer) return;

    const tilesLoaded = document.querySelector(".leaflet-tile");
    if (
      !tilesLoaded ||
      window.getComputedStyle(tilesLoaded).display === "none"
    ) {
      console.log("Map tiles not properly rendered, trying to redraw");

      // Force map redraw
      this.map.invalidateSize(true);

      // Check again after a short delay
      setTimeout(() => {
        const tilesLoaded = document.querySelector(".leaflet-tile");
        if (
          !tilesLoaded ||
          window.getComputedStyle(tilesLoaded).display === "none"
        ) {
          console.log(
            "Map still not rendering properly, trying one more time with different approach"
          );

          // Final attempt - toggle display and redraw
          mapContainer.style.display = "none";
          setTimeout(() => {
            mapContainer.style.display = "block";
            this.map.invalidateSize(true);
          }, 200);
        }
      }, 500);
    }
  }
}

export default MapView;
