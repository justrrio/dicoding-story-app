class AddStoryView {
  constructor() {
    this.app = document.getElementById("app-container");
    this.stream = null;
  }

  render() {
    this.app.innerHTML = `
      <section class="container">
        <div class="form-container">
          <h2><i class="fas fa-plus-circle"></i> Add New Story</h2>
          <form id="add-story-form">
            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" class="form-control" rows="3" required></textarea>
            </div>
            <div class="form-group">
              <label>Take a Photo</label>
              <div class="camera-container">
                <div class="camera-preview">
                  <video id="camera-preview" autoplay></video>
                  <canvas id="canvas" style="display: none;"></canvas>
                </div>
                <div class="camera-buttons">
                  <button type="button" class="btn" id="start-camera"><i class="fas fa-camera"></i> Start Camera</button>
                  <button type="button" class="btn" id="capture-photo" style="display: none;"><i class="fas fa-camera-retro"></i> Capture</button>
                  <button type="button" class="btn" id="retry-photo" style="display: none;"><i class="fas fa-redo"></i> Retry</button>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Select Location</label>
              <div class="map-container">
                <div id="mapid"></div>
              </div>
              <p class="form-text">Click on the map to select a location</p>
              <input type="hidden" id="lat" name="lat">
              <input type="hidden" id="lon" name="lon">
              <div id="selected-location" class="selected-location"></div>
            </div>
            <button type="submit" class="btn btn-block" id="submit-story">Submit Story</button>
            <button type="button" class="btn btn-secondary btn-block" id="test-notification" style="margin-top: 10px;">Test Notification</button>
          </form>
        </div>
      </section>
    `;

    this._initializeMap();
    this._attachEventListeners();
  }

  _initializeMap() {
    setTimeout(() => {
      const map = L.map("mapid").setView([-6.2, 106.816], 13);
      let marker;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Add Geocoder
      const geocoder = L.Control.geocoder({
        defaultMarkGeocode: false,
      })
        .on("markgeocode", function (e) {
          const bbox = e.geocode.bbox;
          const poly = L.polygon([
            bbox.getSouthEast(),
            bbox.getNorthEast(),
            bbox.getNorthWest(),
            bbox.getSouthWest(),
          ]).addTo(map);
          map.fitBounds(poly.getBounds());
        })
        .addTo(map);

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;

        // Update hidden inputs
        document.getElementById("lat").value = lat;
        document.getElementById("lon").value = lng;
        document.getElementById("selected-location").innerHTML = `
          <p><strong>Selected Location:</strong> Lat: ${lat.toFixed(
            6
          )}, Long: ${lng.toFixed(6)}</p>
        `;

        // Add or update marker
        if (marker) {
          marker.setLatLng([lat, lng]);
        } else {
          marker = L.marker([lat, lng]).addTo(map);
        }

        marker.bindPopup("Your story location").openPopup();
      });

      // Store map instance to access it later
      this.map = map;
    }, 100);
  }
  _attachEventListeners() {
    const startCamera = document.getElementById("start-camera");
    const capturePhoto = document.getElementById("capture-photo");
    const retryPhoto = document.getElementById("retry-photo");
    const form = document.getElementById("add-story-form");
    const testNotification = document.getElementById("test-notification");

    startCamera.addEventListener("click", () => this._startCamera());
    capturePhoto.addEventListener("click", () => this._capturePhoto());
    retryPhoto.addEventListener("click", () => this._retryPhoto());
    form.addEventListener("submit", (e) => this._handleSubmit(e));
    testNotification.addEventListener("click", () => this._testNotification());
  }

  _startCamera() {
    const video = document.getElementById("camera-preview");
    const startButton = document.getElementById("start-camera");
    const captureButton = document.getElementById("capture-photo");

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        this.stream = stream;
        video.srcObject = stream;
        startButton.style.display = "none";
        captureButton.style.display = "block";
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
        alert(
          "Error accessing camera. Please make sure your camera is enabled and try again."
        );
      });
  }

  _capturePhoto() {
    const video = document.getElementById("camera-preview");
    const canvas = document.getElementById("canvas");
    const captureButton = document.getElementById("capture-photo");
    const retryButton = document.getElementById("retry-photo");

    // Set canvas dimensions to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to the canvas
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop the video stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    // Hide video and show canvas with captured image
    video.style.display = "none";
    canvas.style.display = "block";

    // Change buttons
    captureButton.style.display = "none";
    retryButton.style.display = "block";
  }

  _retryPhoto() {
    const video = document.getElementById("camera-preview");
    const canvas = document.getElementById("canvas");
    const captureButton = document.getElementById("capture-photo");
    const retryButton = document.getElementById("retry-photo");

    // Clear canvas and hide it
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = "none";

    // Show video again
    video.style.display = "block";

    // Restart camera
    this._startCamera();

    // Change buttons
    retryButton.style.display = "none";
    captureButton.style.display = "block";
  }

  _handleSubmit(e) {
    e.preventDefault();

    // Get form data
    const description = document.getElementById("description").value;
    const canvas = document.getElementById("canvas");
    const lat = document.getElementById("lat").value;
    const lon = document.getElementById("lon").value;

    // Check if photo is taken
    if (canvas.style.display === "none") {
      alert("Please take a photo before submitting.");
      return;
    }

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", blob, "photo.jpg");

      if (lat && lon) {
        formData.append("lat", lat);
        formData.append("lon", lon);
      }

      // Dispatch custom event with form data
      const event = new CustomEvent("story:submit", {
        detail: { formData },
      });
      document.dispatchEvent(event);
    }, "image/jpeg");
  }
  showSubmitResult(result) {
    console.log("showSubmitResult called with:", result);
    const form = document.getElementById("add-story-form");

    if (!result.error) {
      console.log(
        "Story was successful, showing success message and redirecting"
      );
      form.innerHTML = `
        <div class="alert alert-success">
          <p><i class="fas fa-check-circle"></i> Story submitted successfully!</p>
          <p>Redirecting to home page...</p>
        </div>
        <a href="#/" class="btn btn-block">Back to Home</a>
      `;

      // Stop the camera stream if it's still active
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }

      // Auto-redirect to home after 2 seconds
      console.log("Setting up redirect timer for 2 seconds");
      setTimeout(() => {
        console.log("Redirecting to home page now");
        window.location.hash = "#/";
      }, 2000);
    } else {
      console.log("Story submission failed, showing error message");
      form.insertAdjacentHTML(
        "afterbegin",
        `
        <div class="alert alert-danger">
          <p><i class="fas fa-exclamation-circle"></i> Failed to submit story: ${result.message}</p>
        </div>
      `
      );
    }
  }
  _testNotification() {
    console.log("Testing notification from view...");
    try {
      // Test simple browser notification directly
      if (Notification.permission === "granted") {
        const notification = new Notification("Test Notification", {
          body: "This is a test notification to check if notifications work",
          icon: "/icons/app-icon.svg",
        });

        notification.onclick = function () {
          console.log("Test notification clicked");
          notification.close();
        };

        console.log("Test notification sent successfully");
      } else if (Notification.permission === "default") {
        // Request permission
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            this._testNotification(); // Retry after permission granted
          } else {
            alert(
              "Notification permission denied. Please enable notifications in browser settings."
            );
          }
        });
      } else {
        console.log("Notification permission denied");
        alert(
          "Notification permission denied. Please enable notifications in browser settings."
        );
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      alert("Error sending test notification: " + error.message);
    }
  }

  cleanup() {
    // Stop the camera stream if it's still active
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}

export default AddStoryView;
