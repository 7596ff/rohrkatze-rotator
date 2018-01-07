const CommandTemplate = require("casca").CommandTemplate;
module.exports = new CommandTemplate("channel", { type: "channel", permission: "manageMessages", column: "starboard" });
module.exports.category = "starboard";
