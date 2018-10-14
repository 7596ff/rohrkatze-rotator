const config = require("../config.json");
const migrate = require("casca/migrate.js");

migrate(config).then(() => process.exit(0));
