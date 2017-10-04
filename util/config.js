/* jshint esversion: 7 */

// retrieves the complete set of configuration values
// from the current environment
const HOSTNAME = process.env.HOST ? process.env.HOST : "127.0.0.1";
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const KEY = process.env.HEADLESS_KEY ? process.env.HEADLESS_KEY : null;

module.exports = {
    HOSTNAME: HOSTNAME,
    PORT: PORT,
    KEY: KEY
};
