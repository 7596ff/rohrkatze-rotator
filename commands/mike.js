const mike = require("../json/mike.json");

async function exec(message, ctx) {
    return ctx.send(mike[Math.floor(Math.random() * mike.length)]).then((msg) => {
        if (msg.channel.guild == "137589613312081920") msg.addReaction("ixmikeW:256896118380691466");
    });
}

module.exports = {
    name: "mike",
    aliases: ["ixmike", "miek"],
    exec
};

