class MapPresenter {
  constructor({ view, model }) {
    this.view = view;
    this.model = model;
  }

  async init() {
    try {
      // Check if user is logged in
      if (this.model.isLoggedIn()) {
        // Fetch stories with location
        const result = await this.model.getStories(1, 50, 1);

        if (!result.error) {
          // Only show stories with location data
          const storiesWithLocation = result.listStory.filter(
            (story) => story.lat && story.lon
          );
          this.view.render(storiesWithLocation);
        } else {
          console.error("Failed to fetch stories for map:", result.message);
          this.view.render([]);
        }
      } else {
        // Redirect to login if not logged in
        window.location.hash = "#/login";
      }
    } catch (error) {
      console.error("Error initializing map page:", error);
      this.view.render([]);
    }
  }
}

export default MapPresenter;
