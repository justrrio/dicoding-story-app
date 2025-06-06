class StoryDetailPresenter {
  constructor({ view, model }) {
    this.view = view;
    this.model = model;
    this.currentStoryId = null;

    // Bind event listeners
    this._bindEvents();
  }

  _bindEvents() {
    // Listen for favorite toggle events
    document.addEventListener(
      "favorite:toggle",
      this._handleFavoriteToggle.bind(this)
    );

    // Listen for online status changes
    window.addEventListener("online", this._syncPendingActions.bind(this));
  }

  async init(id) {
    // Show loading state
    this.view.render(null, true);
    this.currentStoryId = id;

    try {
      // Check if user is logged in
      if (this.model.isLoggedIn()) {
        // Fetch story details
        const result = await this.model.getStoryDetail(id);
        this.view.render(result, false);

        // Update favorite button state
        if (result && result.story) {
          await this._updateFavoriteButtonState(result.story.id);
        }
      } else {
        // Redirect to login if not logged in
        window.location.hash = "#/login";
      }
    } catch (error) {
      console.error("Error fetching story details:", error);
      this.view.render({ error: true, message: error.message }, false);
    }
  }

  async _updateFavoriteButtonState(storyId) {
    try {
      const isFavorite = await this.model.isFavorite(storyId);
      this.view.updateFavoriteButton(storyId, isFavorite);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  }

  async _handleFavoriteToggle(event) {
    const { storyId, storyData } = event.detail;

    if (storyId !== this.currentStoryId) return;

    try {
      const isFavorite = await this.model.isFavorite(storyId);

      if (navigator.onLine) {
        // Online: Perform action immediately
        if (isFavorite) {
          await this.model.removeFavorite(storyId);
          this._showToast("Removed from favorites", "success");
        } else {
          await this.model.addFavorite(storyData);
          this._showToast("Added to favorites", "success");
        }

        // Update button state
        await this._updateFavoriteButtonState(storyId);
      } else {
        // Offline: Queue action
        await this._queueOfflineAction(
          isFavorite ? "remove" : "add",
          storyId,
          storyData
        );
        this._showToast("Action queued for when you're back online", "info");

        // Update UI optimistically
        this.view.updateFavoriteButton(storyId, !isFavorite);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      this._showToast("Failed to update favorite", "error");
    }
  }

  async _queueOfflineAction(action, storyId, storyData = null) {
    const pendingActions = JSON.parse(
      localStorage.getItem("pending_favorite_actions") || "[]"
    );

    // Remove any existing actions for this story to avoid conflicts
    const filteredActions = pendingActions.filter((a) => a.storyId !== storyId);

    // Add new action
    filteredActions.push({
      action,
      storyId,
      storyData,
      timestamp: Date.now(),
    });

    localStorage.setItem(
      "pending_favorite_actions",
      JSON.stringify(filteredActions)
    );
  }

  async _syncPendingActions() {
    try {
      const pendingActions = JSON.parse(
        localStorage.getItem("pending_favorite_actions") || "[]"
      );

      if (pendingActions.length === 0) return;

      console.log("Syncing pending favorite actions:", pendingActions.length);

      for (const action of pendingActions) {
        try {
          if (action.action === "add" && action.storyData) {
            await this.model.addFavorite(action.storyData);
          } else if (action.action === "remove") {
            await this.model.removeFavorite(action.storyId);
          }
        } catch (error) {
          console.error("Error syncing action:", action, error);
        }
      }

      // Clear synced actions
      localStorage.removeItem("pending_favorite_actions");

      // Update current story's favorite state if still viewing it
      if (this.currentStoryId) {
        await this._updateFavoriteButtonState(this.currentStoryId);
      }

      this._showToast("Favorites synced successfully", "success");
    } catch (error) {
      console.error("Error syncing pending actions:", error);
    }
  }

  _showToast(message, type = "info") {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll(".toast");
    existingToasts.forEach((toast) => toast.remove());

    // Create new toast
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="toast-close">&times;</button>
    `;

    // Add to page
    document.body.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);

    // Add click to close
    const closeBtn = toast.querySelector(".toast-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => toast.remove());
    }
  }
}

export default StoryDetailPresenter;
