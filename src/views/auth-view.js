class AuthView {
  constructor() {
    this.app = document.getElementById("app-container");
  }

  renderLogin() {
    this.app.innerHTML = `
      <section class="container">
        <div class="form-container">
          <h2><i class="fas fa-sign-in-alt"></i> Login</h2>
          <form id="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-block">Login</button>
            <p class="text-center mt-3">
              Don't have an account? <a href="#/register">Register</a>
            </p>
          </form>
        </div>
      </section>
    `;

    this._attachLoginEventListeners();
  }

  renderRegister() {
    this.app.innerHTML = `
      <section class="container">
        <div class="form-container">
          <h2><i class="fas fa-user-plus"></i> Register</h2>
          <form id="register-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="password">Password (min. 8 characters)</label>
              <input type="password" id="password" class="form-control" minlength="8" required>
            </div>
            <button type="submit" class="btn btn-block">Register</button>
            <p class="text-center mt-3">
              Already have an account? <a href="#/login">Login</a>
            </p>
          </form>
        </div>
      </section>
    `;

    this._attachRegisterEventListeners();
  }
  _attachLoginEventListeners() {
    const form = document.getElementById("login-form");
    if (!form) {
      console.error(
        "Login form not found when trying to attach event listeners"
      );
      return;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      if (!emailInput || !passwordInput) {
        console.error("Login form inputs not found");
        return;
      }

      const email = emailInput.value;
      const password = passwordInput.value;

      // Dispatch custom event for login
      const event = new CustomEvent("auth:login", {
        detail: { email, password },
      });
      document.dispatchEvent(event);
    });
  }
  _attachRegisterEventListeners() {
    const form = document.getElementById("register-form");
    if (!form) {
      console.error(
        "Register form not found when trying to attach event listeners"
      );
      return;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      if (!nameInput || !emailInput || !passwordInput) {
        console.error("Register form inputs not found");
        return;
      }

      const name = nameInput.value;
      const email = emailInput.value;
      const password = passwordInput.value;

      // Dispatch custom event for registration
      const event = new CustomEvent("auth:register", {
        detail: { name, email, password },
      });
      document.dispatchEvent(event);
    });
  }
  showAuthResult(result, type) {
    const form = document.getElementById(`${type}-form`);

    // Check if form exists
    if (!form) {
      console.error(`Form with id "${type}-form" not found.`);
      return;
    }

    // Remove any existing alerts
    const existingAlert = form.querySelector(".alert");
    if (existingAlert) {
      existingAlert.remove();
    }

    if (!result.error) {
      form.insertAdjacentHTML(
        "afterbegin",
        `
        <div class="alert alert-success">
          <p><i class="fas fa-check-circle"></i> ${result.message}</p>
        </div>
      `
      );
      if (type === "login") {
        // Trigger notification initialization event
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent("user:loggedIn"));
        }, 500);

        // Redirect to home after successful login
        setTimeout(() => {
          window.location.hash = "#/";
        }, 1000);
      } else if (type === "register") {
        // Redirect to login after successful registration
        setTimeout(() => {
          window.location.hash = "#/login";
        }, 1000);
      }
    } else {
      form.insertAdjacentHTML(
        "afterbegin",
        `
        <div class="alert alert-danger">
          <p><i class="fas fa-exclamation-circle"></i> ${result.message}</p>
        </div>
      `
      );
    }
  }
}

export default AuthView;
