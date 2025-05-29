import NotificationHelper from "../scripts/notification-helper-new.js";

class AddStoryPresenter {
  constructor({ view, model }) {
    this.view = view;
    this.model = model;
    this.notificationHelper = new NotificationHelper();
    this._initListener();
  }
  async init() {
    this.view.render();

    // Initialize notifications when add story page loads
    try {
      await this.notificationHelper.init();
      console.log("Notification helper initialized for add story page");

      // Request permission explicitly if not granted
      if (Notification.permission === "default") {
        console.log("Requesting notification permission...");
        const permission = await this.notificationHelper.requestPermission();
        console.log("Permission result:", permission);
      }
    } catch (error) {
      console.warn("Failed to initialize notifications:", error);
    }
  }
  _initListener() {
    document.addEventListener("story:submit", async (event) => {
      try {
        const { formData } = event.detail;
        console.log("Submitting story:", formData.get("description"));

        const result = await this.model.addStory(formData);
        console.log("Story submission result:", result);

        // Show notification if story was created successfully
        if (!result.error) {
          try {
            console.log("Attempting to show notification...");
            const storyData = {
              id: result.id || Date.now(),
              description: formData.get("description"),
              photoUrl: result.photoUrl || "default-image",
            }; // Simplified notification approach - same as test notification
            try {
              console.log("Attempting to show story notification...");

              if (Notification.permission === "granted") {
                const notification = new Notification("Story berhasil dibuat", {
                  body: `Anda telah membuat story baru dengan deskripsi: ${storyData.description}`,
                  icon: "/icons/app-icon.svg",
                });

                notification.onclick = function () {
                  console.log("Story notification clicked");
                  notification.close();
                  // Optional: navigate to story detail
                  // window.location.hash = `#/story/${storyData.id}`;
                };

                console.log("Story notification sent successfully");
              } else {
                console.warn(
                  "Notification permission not granted:",
                  Notification.permission
                );
              }
            } catch (notificationError) {
              console.error(
                "Failed to show story notification:",
                notificationError
              );
            }
          } catch (notificationError) {
            console.error("Failed to show notification:", notificationError);
            // Don't let notification errors affect the main flow
          }
        }

        console.log("Calling view.showSubmitResult with:", result);
        this.view.showSubmitResult(result);
        console.log("showSubmitResult called successfully");
      } catch (error) {
        console.error("Error submitting story:", error);
        this.view.showSubmitResult({ error: true, message: error.message });
      }
    });
  }

  cleanup() {
    // Remove event listeners to prevent memory leaks
    document.removeEventListener("story:submit", this._handleSubmit);
    // Clean up view resources
    this.view.cleanup();
  }
}

export default AddStoryPresenter;
