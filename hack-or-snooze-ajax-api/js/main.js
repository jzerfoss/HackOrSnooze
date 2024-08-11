"use strict";

// Cache DOM elements for efficiency
const $body = $("body");
const $storiesLoadingMsg = $("#stories-loading-msg");
const $allStoriesList = $("#all-stories-list");
const $loginForm = $("#login-form");
const $signupForm = $("#signup-form");
const $navLogin = $("#nav-login");
const $navUserProfile = $("#nav-user-profile");
const $navLogOut = $("#nav-logout");

/** 
 * Hides most of the page components to simplify visibility toggling.
 */
function hidePageComponents() {
  const components = [
    $allStoriesList,
    $loginForm,
    $signupForm,
  ];
  components.forEach(component => {
    console.debug(`Hiding component: ${component.attr('id')}`);
    component.hide();
  });
}

/**
 * Initializes the application by checking for a logged-in user and loading stories.
 */
async function start() {
  console.debug("Application start");

  try {
    // Check for a remembered user and login if necessary
    await checkForRememberedUser();
    
    // Load and display stories
    await getAndShowStoriesOnStart();

    // Update UI if a user is logged in
    if (currentUser) {
      updateUIOnUserLogin();
    }
  } catch (error) {
    console.error("Error during startup", error);
  }
}

// Ensure DOM is fully loaded before starting the application
$(document).ready(start);

// Provide a warning to adjust console settings for verbose debugging
console.warn("HEY STUDENT: This program sends many debug messages to the console. If you don't see the message 'Application start' below, you're not seeing those helpful debug messages. In your browser console, click on menu 'Default Levels' and add Verbose.");
