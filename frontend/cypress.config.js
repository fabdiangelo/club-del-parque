const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:5173',
    projectId: 'dqqw7q',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 100000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    video: true,
    videoCompression: 32,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    retries: {
      openMode: 0,
      runMode: 0,
    },
    env: {
      CYPRESS_URL: 'http://localhost:5173',
      CYPRESS_ADMIN_EMAIL: 'admin@admin',
      CYPRESS_ADMIN_PASSWORD: 'Q1w2e3r4!',
      CYPRESS_USER_EMAIL: 'user@user',
      CYPRESS_USER_PASSWORD: 'Q1w2e3r4!',
      CYPRESS_FED_EMAIL: '1@fed',
      CYPRESS_FED_PASSWORD: 'Q1w2e3r4!',
      CYPRESS_FED2_EMAIL: '2@fed',
      CYPRESS_FED2_PASSWORD: 'Q1w2e3r4!',
    },
  },
});
