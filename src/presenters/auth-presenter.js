class AuthPresenter {
  constructor({ view, model }) {
    this.view = view;
    this.model = model;
    this._initListener();
  }
  renderLogin() {
    this.view.renderLogin();
    return document.getElementById("login-form") !== null;
  }

  renderRegister() {
    this.view.renderRegister();
    return document.getElementById("register-form") !== null;
  }

  ensureFormRendered(formType) {
    if (formType === "login" && !document.getElementById("login-form")) {
      return this.renderLogin();
    } else if (
      formType === "register" &&
      !document.getElementById("register-form")
    ) {
      return this.renderRegister();
    }
    return true;
  }
  _initListener() {
    document.addEventListener("auth:login", async (event) => {
      try {
        const { email, password } = event.detail;
        const result = await this.model.login(email, password);

        // Make sure login view is rendered and retry if not
        let retryCount = 0;
        const maxRetries = 3;
        let formRendered = this.ensureFormRendered("login");

        const processResult = () => {
          if (formRendered) {
            this.view.showAuthResult(result, "login");

            if (!result.error) {
              // Update UI based on login status
              this._updateNavbar();
            }
          } else if (retryCount < maxRetries) {
            retryCount++;
            console.log(
              `Retrying to render login form (attempt ${retryCount})`
            );
            setTimeout(() => {
              formRendered = this.ensureFormRendered("login");
              processResult();
            }, 200);
          } else {
            console.error(
              "Failed to render login form after multiple attempts"
            );
            // Fallback to redirect
            if (!result.error) {
              window.location.hash = "#/";
            }
          }
        };

        // Start processing with small delay to ensure DOM update
        setTimeout(processResult, 100);
      } catch (error) {
        console.error("Login error:", error);

        // Make sure login view is rendered
        const formRendered = this.ensureFormRendered("login");

        // Process with small timeout
        setTimeout(() => {
          if (formRendered) {
            this.view.showAuthResult(
              { error: true, message: error.message },
              "login"
            );
          } else {
            console.error("Failed to render login form to show error");
            alert(`Login error: ${error.message}`);
          }
        }, 100);
      }
    });
    document.addEventListener("auth:register", async (event) => {
      try {
        const { name, email, password } = event.detail;
        const result = await this.model.register(name, email, password);

        // Make sure register view is rendered and retry if not
        let retryCount = 0;
        const maxRetries = 3;
        let formRendered = this.ensureFormRendered("register");

        const processResult = () => {
          if (formRendered) {
            this.view.showAuthResult(result, "register");
          } else if (retryCount < maxRetries) {
            retryCount++;
            console.log(
              `Retrying to render register form (attempt ${retryCount})`
            );
            setTimeout(() => {
              formRendered = this.ensureFormRendered("register");
              processResult();
            }, 200);
          } else {
            console.error(
              "Failed to render register form after multiple attempts"
            );
            // Fallback to show message
            if (!result.error) {
              alert("Registration successful! Please log in.");
              window.location.hash = "#/login";
            }
          }
        };

        // Start processing with small delay to ensure DOM update
        setTimeout(processResult, 100);
      } catch (error) {
        console.error("Registration error:", error);

        // Make sure register view is rendered
        const formRendered = this.ensureFormRendered("register");

        // Process with small timeout
        setTimeout(() => {
          if (formRendered) {
            this.view.showAuthResult(
              { error: true, message: error.message },
              "register"
            );
          } else {
            console.error("Failed to render register form to show error");
            alert(`Registration error: ${error.message}`);
          }
        }, 100);
      }
    });
  }

  _updateNavbar() {
    const loginLink = document.getElementById("loginLink");

    if (this.model.isLoggedIn()) {
      const name = localStorage.getItem("name");
      loginLink.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout (${name})`;
      loginLink.href = "#/logout";
    } else {
      loginLink.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login`;
      loginLink.href = "#/login";
    }
  }
}

export default AuthPresenter;
