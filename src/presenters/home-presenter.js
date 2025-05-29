class HomePresenter {
  constructor({ view, model }) {
    this.view = view;
    this.model = model;
    this.stories = [];
    this.favoriteToggleHandler = null;

    this._attachEventListeners();
  }

  _attachEventListeners() {
    // Remove existing listener if any
    if (this.favoriteToggleHandler) {
      document.removeEventListener("favorite:toggle", this.favoriteToggleHandler);
    }

    // Create bound handler to maintain context
    this.favoriteToggleHandler = async (e) => {
      await this._handleFavoriteToggle(e.detail.storyId, e.detail.storyData);
    };

    // Listen for favorite toggle events from view
    document.addEventListener("favorite:toggle", this.favoriteToggleHandler);
  }

  destroy() {
    // Clean up event listeners when presenter is destroyed
    if (this.favoriteToggleHandler) {
      document.removeEventListener("favorite:toggle", this.favoriteToggleHandler);
      this.favoriteToggleHandler = null;
    }
  }
  async init() {
    // Show loading state
    this.view.render();

    try {
      // Fetch stories - now works for both authenticated users and guests
      const result = await this.model.getStories(1, 10, 1);

      if (!result.error) {
        this.stories = result.listStory;
        this.view.render(this.stories);

        // Update favorite buttons based on current favorites (if user is logged in)
        if (this.model.isLoggedIn()) {
          await this._updateFavoriteButtons();
        } else {
          // For guest users, all favorite buttons start as inactive
          this._initializeGuestFavoriteButtons();
        }
      } else {
        console.error("Failed to fetch stories:", result.message);
        this.view.render([]);
      }
    } catch (error) {
      console.error("Error initializing home page:", error);
      this.view.render([]);
    }
  }

  _initializeGuestFavoriteButtons() {
    // For guest users, initialize all favorite buttons as inactive
    // Guest users can still use favorites, they just get saved locally
    for (const story of this.stories) {
      this.view.updateFavoriteButton(story.id, false);
    }
  }

  async _updateFavoriteButtons() {
    try {
      for (const story of this.stories) {
        const isFavorite = await this.model.isFavorite(story.id);
        this.view.updateFavoriteButton(story.id, isFavorite);
      }
    } catch (error) {
      console.error("Error updating favorite buttons:", error);
    }
  }

  async _handleFavoriteToggle(storyId, storyData) {
    try {
      console.log("Toggling favorite for story:", storyId);

      // Check if story is currently favorite
      const isFavorite = await this.model.isFavorite(storyId);

      let result;
      if (isFavorite) {
        // Remove from favorites
        result = await this._removeFavorite(storyId);
        if (result.success) {
          this.view.updateFavoriteButton(storyId, false);
          const message = result.offline
            ? "Removed from favorites (will sync when online)"
            : "Removed from favorites";
          this.view.showToast(message, "success");
        }
      } else {
        // Add to favorites - need full story data
        const fullStoryData = await this._getFullStoryData(storyId, storyData);
        result = await this._addFavorite(fullStoryData);
        if (result.success) {
          this.view.updateFavoriteButton(storyId, true);
          const message = result.offline
            ? "Added to favorites (will sync when online)"
            : "Added to favorites";
          this.view.showToast(message, "success");
        }
      }

      if (!result.success) {
        this.view.showToast("Failed to update favorite", "error");
        // Reset button state
        this.view.updateFavoriteButton(storyId, isFavorite);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      this.view.showToast("Failed to update favorite", "error");
    }
  }

  async _getFullStoryData(storyId, basicData) {
    try {
      // Try to get full story details
      const result = await this.model.getStoryDetail(storyId);
      if (!result.error && result.story) {
        return result.story;
      }
    } catch (error) {
      console.error("Error getting full story data:", error);
    }

    // Fallback to basic data from card
    return {
      id: storyId,
      ...basicData,
      createdAt: new Date().toISOString(),
    };
  }

  async _addFavorite(storyData) {
    try {
      // If offline, queue the action
      if (!navigator.onLine) {
        return await this._queueOfflineAction("add", storyData.id, storyData);
      } else {
        // Add to IndexedDB
        await this.model.addToFavorites(storyData);
        return { success: true, offline: false };
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
      return { success: false, error: error.message };
    }
  }

  async _removeFavorite(storyId) {
    try {
      // If offline, queue the action
      if (!navigator.onLine) {
        return await this._queueOfflineAction("remove", storyId);
      } else {
        // Remove from IndexedDB
        await this.model.removeFromFavorites(storyId);
        return { success: true, offline: false };
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      return { success: false, error: error.message };
    }
  }

  async _queueOfflineAction(action, storyId, storyData = null) {
    try {
      // Get existing pending actions
      const pendingActions = JSON.parse(
        localStorage.getItem("pending_favorite_actions") || "[]"
      );

      const offlineAction = {
        id: Date.now(),
        action,
        storyId,
        storyData,
        timestamp: new Date().toISOString(),
      };

      pendingActions.push(offlineAction);

      // Save to localStorage
      localStorage.setItem(
        "pending_favorite_actions",
        JSON.stringify(pendingActions)
      );

      console.log("Queued offline favorite action:", offlineAction);
      return { success: true, offline: true };
    } catch (error) {
      console.error("Error queuing offline action:", error);
      return { success: false, error: error.message };
    }
  }

  // Cleanup method
  cleanup() {
    // Remove event listeners if needed
    // Currently using document listeners which persist
  }
}

export default HomePresenter;
