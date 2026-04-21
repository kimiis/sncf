const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./e2e",
    timeout: 30_000,
    retries: 1,
    workers: 1,

    use: {
        baseURL: "http://localhost:3000",
        headless: true,
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],

    // Lance le frontend avant les tests
    webServer: {
        command: "npm start",
        cwd: "./frontend",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
    },
});
