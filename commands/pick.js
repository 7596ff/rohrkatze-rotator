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
    
    let data;
    try {
        data = await ctx.client.util.getFolder(ctx.client, message.channel.guild);
    } catch (error) {
        if (error === "no_images") {
            return ctx.failure(ctx.strings.get("rotate_no_images"));
        } else if (error === "one_image") {
            return ctx.failure(ctx.strings.get("rotate_one_image"));
        }
    }

    let images = data.folder.map((item) => item.replace(/\D/g, ""));
    let choice = ctx.content.replace(/\D/g, "");

    if (images.includes(choice)) {
        await ctx.client.util.rotate(ctx.client, message.channel.guild, data.folder[images.indexOf(choice)]);
        return ctx.success("");
    } else {
        ctx.send(ctx.strings.get("show_no_image"));
    }
}

module.exports = {
    name: "pick",
    category: "rotate",
    typing: true,
    exec
};
