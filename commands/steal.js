const Snekfetch = require("snekfetch");

const urlRegex = /^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/g;
const customEmoji = /<a?:[a-zA-Z1-9-_]{2,}:\d{17,20}>/g;

async function exec(message, ctx) {
    const emoji = ctx.options[0];
    let url, name;

    if (urlRegex.test(emoji)) {
        url = emoji;
    } else if (customEmoji.test(emoji)) {
        url = emoji.split(":")[2].replace(">", ""); //TODO: use a real match group here
        url = `https://cdn.discordapp.com/emojis/${url}.png?v=1`;
    } else {
        return ctx.failure(ctx.strings.get("steal_no_emoji"));
    }

    if (ctx.options[1]) {
        name = ctx.options[1];
    } else {
        return ctx.failure(ctx.strings.get("steal_no_name"));
    }

    let image;
    try {
        image = await Snekfetch.get(url);
    } catch (e) {
        console.error(e);
        return ctx.failure(ctx.strings.get("steal_download"));
    }
    
    let result;
    try {
        result = message.channel.guild.createEmoji({ name, image: "data:image/png;base64," + image.body.toString("base64") });
    } catch (e) {
        console.error(e);
        return ctx.failure(ctx.strings.get("steal_upload"));
    }

    return ctx.success("");
}

module.exports = {
    name: "steal",
    category: "utility",
    exec
};

