// Debug Helper Script for Dicoding Story App
// Copy and paste this in browser console for debugging

console.log("=== Dicoding Story App Debug Helper ===");

// Test 1: Check notification support and permission
function checkNotifications() {
  console.log("\n--- Notification Check ---");
  console.log("Notification supported:", "Notification" in window);
  console.log("Service Worker supported:", "serviceWorker" in navigator);
  console.log("Current permission:", Notification.permission);

  if (Notification.permission === "default") {
    console.log("Permission is default - you can request it");
  } else if (Notification.permission === "granted") {
    console.log("✅ Permission granted - notifications should work");
  } else {
    console.log("❌ Permission denied - notifications blocked");
  }
}

// Test 2: Request notification permission
function requestPermission() {
  console.log("\n--- Requesting Permission ---");
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      console.log("Permission result:", permission);
      if (permission === "granted") {
        console.log("✅ Permission granted!");
        testSimpleNotification();
      } else {
        console.log("❌ Permission denied");
      }
    });
  } else {
    console.log("❌ Notifications not supported");
  }
}

// Test 3: Send a simple test notification
function testSimpleNotification() {
  console.log("\n--- Testing Simple Notification ---");
  try {
    if (Notification.permission === "granted") {
      const notification = new Notification("Debug Test", {
        body: "If you see this, notifications are working!",
        icon: "/icons/app-icon.svg",
      });

      notification.onclick = function () {
        console.log("✅ Notification clicked!");
        notification.close();
      };

      console.log("✅ Notification sent successfully");

      // Auto close after 3 seconds
      setTimeout(() => {
        notification.close();
        console.log("Notification auto-closed");
      }, 3000);
    } else {
      console.log("❌ Permission not granted");
    }
  } catch (error) {
    console.error("❌ Notification failed:", error);
  }
}

// Test 4: Check current page and app state
function checkAppState() {
  console.log("\n--- App State Check ---");
  console.log("Current URL:", window.location.href);
  console.log("Current hash:", window.location.hash);
  console.log("Page title:", document.title);

  // Check if we're on add story page
  const addStoryForm = document.getElementById("add-story-form");
  console.log("Add story form exists:", !!addStoryForm);

  // Check if test button exists
  const testButton = document.getElementById("test-notification");
  console.log("Test notification button exists:", !!testButton);

  // Check if logged in
  const token = localStorage.getItem("token");
  console.log("User logged in:", !!token);
}

// Test 5: Test story submission process
function testStoryFlow() {
  console.log("\n--- Testing Story Submission Flow ---");

  // Check if on add story page
  if (!document.getElementById("add-story-form")) {
    console.log("❌ Not on add story page. Navigate to #/add first");
    return;
  }

  // Fill description
  const description = document.getElementById("description");
  if (description) {
    description.value = "Debug test story";
    console.log("✅ Description filled");
  }

  // Check photo
  const canvas = document.getElementById("canvas");
  if (canvas && canvas.style.display !== "none") {
    console.log("✅ Photo taken");
  } else {
    console.log("⚠️ No photo taken - this will cause validation error");
  }

  console.log("Form ready for submission");
}

// Test 6: Force redirect test
function testRedirect() {
  console.log("\n--- Testing Redirect ---");
  console.log("Current hash:", window.location.hash);

  setTimeout(() => {
    console.log("Redirecting to home...");
    window.location.hash = "#/";
  }, 1000);
}

// Auto-run basic checks
console.log("Running automatic checks...");
checkNotifications();
checkAppState();

// Available functions
console.log("\n=== Available Debug Functions ===");
console.log("• checkNotifications() - Check notification support");
console.log("• requestPermission() - Request notification permission");
console.log("• testSimpleNotification() - Send test notification");
console.log("• checkAppState() - Check current app state");
console.log("• testStoryFlow() - Check story submission form");
console.log("• testRedirect() - Test page redirect");

console.log(
  "\n💡 Quick start: Run requestPermission() then testSimpleNotification()"
);
