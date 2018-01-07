const CommandTemplate = require("casca").CommandTemplate;
module.exports = new CommandTemplate("out", { type: "channel", permission: "manageMessages", column: "pinboardout" });
