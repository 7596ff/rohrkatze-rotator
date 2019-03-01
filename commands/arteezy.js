const arteezy = require("../json/arteezy.json");

async function exec(message, ctx) {
    return ctx.send(arteezy[Math.floor(Math.random() * arteezy.length)]).then((msg) => {
        if (msg.channel.guild == "137589613312081920") msg.addReaction("rtzW:302222677991620608");
    });
}

module.exports = {
    name: "arteezy",
    aliases: ["rtz"],
    exec
};

