const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'https://club-del-parque-8ec2a.web.app',
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
      CYPRESS_URL: 'https://club-del-parque-8ec2a.web.app',
      CYPRESS_ADMIN_EMAIL: 'admin23@gmail.com',
      CYPRESS_ADMIN_PASSWORD: 'Admin123!',
      CYPRESS_USER_EMAIL: 'user@user',
      CYPRESS_USER_PASSWORD: 'Q1w2e3r4!',
      CYPRESS_FED_EMAIL: '1@fed',
      CYPRESS_FED_PASSWORD: 'Q1w2e3r4!',
      CYPRESS_FED2_EMAIL: '2@fed',
      CYPRESS_FED2_PASSWORD: 'Q1w2e3r4!',
    },
  },
});
