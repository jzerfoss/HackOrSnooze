"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/**
 * Represents a single story in the system.
 */
class Story {
  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Extracts and returns the hostname from the story's URL. */
  getHostName() {
    const a = document.createElement('a');
    a.href = this.url;
    return a.hostname;
  }
}

/**
 * Manages a list of Story instances.
 */
class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /**
   * Fetches stories from the API and returns a StoryList instance.
   */
  static async getStories() {
    try {
      const response = await axios({
        url: `${BASE_URL}/stories`,
        method: "GET",
      });
      const stories = response.data.stories.map(story => new Story(story));
      return new StoryList(stories);
    } catch (error) {
      console.error("Failed to fetch stories", error);
      throw error;  // Propagate the error for further handling
    }
  }

  /**
   * Adds a new story to the API and updates the local story list.
   */
  async addStory(currentUser, { title, author, url }) {
    try {
      const token = currentUser.loginToken;
      const response = await axios({
        method: "POST",
        url: `${BASE_URL}/stories`,
        data: { token, story: { title, author, url } },
      });

      const story = new Story(response.data.story);
      this.stories.unshift(story);
      currentUser.ownStories.unshift(story);

      console.debug(`Story added: ${story.title}`);
      return story;
    } catch (error) {
      console.error("Failed to add story", error);
      throw error;
    }
  }

  /**
   * Removes a story from the API and updates the local story list.
   */
  async removeStory(user, storyId) {
    try {
      const token = user.loginToken;
      await axios({
        url: `${BASE_URL}/stories/${storyId}`,
        method: "DELETE",
        data: { token },
      });

      this.stories = this.stories.filter(story => story.storyId !== storyId);
      user.ownStories = user.ownStories.filter(s => s.storyId !== storyId);
      user.favorites = user.favorites.filter(s => s.storyId !== storyId);

      console.debug(`Story removed: ${storyId}`);
    } catch (error) {
      console.error("Failed to remove story", error);
      throw error;
    }
  }
}

/**
 * Represents a user in the system.
 */
class User {
  constructor({
    username,
    name,
    createdAt,
    favorites = [],
    ownStories = []
  }, token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));
    this.loginToken = token;
  }

  /**
   * Registers a new user via the API and returns a User instance.
   */
  static async signup(username, password, name) {
    try {
      const response = await axios({
        url: `${BASE_URL}/signup`,
        method: "POST",
        data: { user: { username, password, name } },
      });

      const { user, token } = response.data;
      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (error) {
      console.error("Failed to sign up", error);
      throw error;
    }
  }

  /**
   * Logs in a user via the API and returns a User instance.
   */
  static async login(username, password) {
    try {
      const response = await axios({
        url: `${BASE_URL}/login`,
        method: "POST",
        data: { user: { username, password } },
      });

      const { user, token } = response.data;
      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (error) {
      console.error("Failed to log in", error);
      throw error;
    }
  }

  /**
   * Logs in a user automatically using stored credentials.
   */
  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      const { user } = response.data;
      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("Failed to login via stored credentials", err);
      return null;
    }
  }

  /**
   * Adds a story to the user's list of favorites and updates the API.
   */
  async addFavorite(story) {
    try {
      this.favorites.push(story);
      await this._addOrRemoveFavorite("add", story);
      console.debug(`Favorite added: ${story.title}`);
    } catch (error) {
      console.error("Failed to add favorite", error);
      throw error;
    }
  }

  /**
   * Removes a story from the user's list of favorites and updates the API.
   */
  async removeFavorite(story) {
    try {
      this.favorites = this.favorites.filter(s => s.storyId !== story.storyId);
      await this._addOrRemoveFavorite("remove", story);
      console.debug(`Favorite removed: ${story.title}`);
    } catch (error) {
      console.error("Failed to remove favorite", error);
      throw error;
    }
  }

  /**
   * Updates the API with the favorite status of a story.
   */
  async _addOrRemoveFavorite(newState, story) {
    try {
      const method = newState === "add" ? "POST" : "DELETE";
      await axios({
        url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
        method: method,
        data: { token: this.loginToken },
      });
    } catch (error) {
      console.error(`Failed to ${newState} favorite`, error);
    }}}