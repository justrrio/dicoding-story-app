class FavoritesPresenter {
  constructor({ view, model }) {
    this.view = view;
    this.model = model;
    this.favorites = [];
    this.pendingOfflineActions = [];
    this.favoriteToggleHandler = null;
    this.onlineHandler = null;

    this._attachEventListeners();
  }

  _attachEventListeners() {
    // Remove existing listeners if any
    this._removeEventListeners();

    // Create bound handlers to maintain context
    this.favoriteToggleHandler = async (e) => {
      await this._handleFavoriteToggle(e.detail.storyId);
    };

    this.onlineHandler = () => {
      this._processPendingOfflineActions();
    };

    // Listen for favorite toggle events from view
    document.addEventListener("favorite:toggle", this.favoriteToggleHandler);

    // Listen for online/offline events to handle pending actions
    window.addEventListener("online", this.onlineHandler);
  }

  _removeEventListeners() {
    if (this.favoriteToggleHandler) {
      document.removeEventListener("favorite:toggle", this.favoriteToggleHandler);
    }
    if (this.onlineHandler) {
      window.removeEventListener("online", this.onlineHandler);
    }
  }

  destroy() {
    // Clean up event listeners when presenter is destroyed
    this._removeEventListeners();
    this.favoriteToggleHandler = null;
    this.onlineHandler = null;
  }

  async init() {
    try {
      console.log("Initializing Favorites page...");

      // Show loading state
      this.view.showLoadingState();

      // Load favorites from IndexedDB (always available offline)
      this.favorites = await this.model.getFavorites();
      console.log("Loaded favorites:", this.favorites);

      // Render favorites
      this.view.render(this.favorites);

      // If online, sync any pending actions
      if (navigator.onLine) {
        await this._processPendingOfflineActions();
      }
    } catch (error) {
      console.error("Error initializing favorites:", error);
      this.view.showError("Failed to load favorites. Please try again.");
    }
  }

  async _handleFavoriteToggle(storyId) {
    try {
      console.log("Toggling favorite for story:", storyId);

      // Check if story is currently in favorites
      const isFavorited = this.favorites.some((fav) => fav.id === storyId);

      if (isFavorited) {
        // Remove from favorites
        await this._removeFavorite(storyId);
      } else {
        // This shouldn't happen in favorites page, but handle anyway
        console.warn("Story not in favorites list, cannot remove");
        this.view.showToast("Story not found in favorites", "error");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      this.view.showToast("Failed to update favorite", "error");
    }
  }

  async _removeFavorite(storyId) {
    try {
      // If offline, queue the action
      if (!navigator.onLine) {
        this._queueOfflineAction("remove", storyId);
        this.view.showToast("Favorite will be updated when online", "success");
      } else {
        // Remove from IndexedDB immediately
        await this.model.removeFromFavorites(storyId);
        this.view.showToast("Removed from favorites", "success");
      }

      // Update local state
      this.favorites = this.favorites.filter((fav) => fav.id !== storyId);

      // Update view
      this.view.removeFavoriteFromView(storyId);
    } catch (error) {
      console.error("Error removing favorite:", error);
      this.view.showToast("Failed to remove favorite", "error");
    }
  }

  _queueOfflineAction(action, storyId, storyData = null) {
    const offlineAction = {
      id: Date.now(),
      action,
      storyId,
      storyData,
      timestamp: new Date().toISOString(),
    };

    this.pendingOfflineActions.push(offlineAction);

    // Save to localStorage for persistence
    localStorage.setItem(
      "pending_favorite_actions",
      JSON.stringify(this.pendingOfflineActions)
    );

    console.log("Queued offline action:", offlineAction);
  }

  async _processPendingOfflineActions() {
    try {
      // Load pending actions from localStorage
      const savedActions = localStorage.getItem("pending_favorite_actions");
      if (savedActions) {
        this.pendingOfflineActions = JSON.parse(savedActions);
      }

      if (this.pendingOfflineActions.length === 0) {
        return;
      }

      console.log(
        "Processing pending offline actions:",
        this.pendingOfflineActions
      );

      const processedActions = [];

      for (const action of this.pendingOfflineActions) {
        try {
          if (action.action === "add") {
            await this.model.addToFavorites(action.storyData);
            console.log(
              "Synced add favorite action for story:",
              action.storyId
            );
          } else if (action.action === "remove") {
            await this.model.removeFromFavorites(action.storyId);
            console.log(
              "Synced remove favorite action for story:",
              action.storyId
            );
          }

          processedActions.push(action.id);
        } catch (error) {
          console.error("Error processing offline action:", action, error);
        }
      }

      // Remove processed actions
      this.pendingOfflineActions = this.pendingOfflineActions.filter(
        (action) => !processedActions.includes(action.id)
      );

      // Update localStorage
      if (this.pendingOfflineActions.length === 0) {
        localStorage.removeItem("pending_favorite_actions");
      } else {
        localStorage.setItem(
          "pending_favorite_actions",
          JSON.stringify(this.pendingOfflineActions)
        );
      }

      if (processedActions.length > 0) {
        console.log(
          `Synced ${processedActions.length} pending favorite actions`
        );
        this.view.showToast(
          `Synced ${processedActions.length} pending changes`,
          "success"
        );

        // Refresh favorites after sync
        await this.refreshFavorites();
      }
    } catch (error) {
      console.error("Error processing pending offline actions:", error);
    }
  }

  async refreshFavorites() {
    try {
      this.favorites = await this.model.getFavorites();
      this.view.render(this.favorites);
    } catch (error) {
      console.error("Error refreshing favorites:", error);
    }
  }

  // Method to add favorite from other pages
  async addFavorite(story) {
    try {
      console.log("Adding story to favorites:", story.id);

      // If offline, queue the action
      if (!navigator.onLine) {
        this._queueOfflineAction("add", story.id, story);
        return { success: true, offline: true };
      } else {
        // Add to IndexedDB
        await this.model.addToFavorites(story);
        return { success: true, offline: false };
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
      return { success: false, error: error.message };
    }
  }

  // Method to remove favorite from other pages
  async removeFavorite(storyId) {
    try {
      console.log("Removing story from favorites:", storyId);

      // If offline, queue the action
      if (!navigator.onLine) {
        this._queueOfflineAction("remove", storyId);
        return { success: true, offline: true };
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

  // Method to check if story is favorite
  async isFavorite(storyId) {
    try {
      return await this.model.isFavorite(storyId);
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  }

  // Cleanup method
  cleanup() {
    // Remove event listeners if needed
    // Currently using document listeners which persist
  }
}

export default FavoritesPresenter;
