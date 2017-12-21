const prettyms = require("pretty-ms");

async function exec(message, ctx) {
    if (message.author.id != message.channel.guild.ownerID && ctx.row.lasttime && parseInt(ctx.row.lasttime) + 600000 >= Date.now()) {
        return ctx.failure(ctx.strings.get(
            "rotate_timeout",
            prettyms(parseInt(ctx.row.lasttime) + 600000 - Date.now())
        ));
    }

    if (ctx.row.dont) {
        return ctx.failure(ctx.strings.get("rotate_cant"));
    }

    let result = await ctx.client.util.rotate(ctx.client, message.channel.guild);

    if (result === "one_image") {
        return ctx.failure(ctx.strings.get("rotate_one_image"));
    } else if (result === "no_images") {
        return ctx.failure(ctx.strings.get("rotate_no_images"));
    } else {
        return ctx.send("♻");
    }
}

module.exports = {
    name: "rotate",
    aliases: ["rotato", "potato", "tomato", "🍅", "🥔"],
    category: "rotate",
    typing: true,
    exec
};
