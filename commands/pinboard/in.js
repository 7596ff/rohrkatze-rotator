const CommandTemplate = require("casca").CommandTemplate;
module.exports = new CommandTemplate("in", { type: "channel", permission: "manageMessages", column: "pinboardin" });
