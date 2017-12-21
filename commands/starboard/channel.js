const CommandTemplate = require("casca").CommandTemplate;
module.exports = new CommandTemplate("starboard", { type: "channel", permission: "manageMessages" });
module.exports.category = "starboard";
