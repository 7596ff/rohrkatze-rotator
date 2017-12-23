const snekfetch = require("snekfetch");

async function checks(member, ctx) {
    return member.permission.has("manageGuild");
}

async function exec(message, ctx) {
    let url = false;

    if (message.mentions.length) {
        url = message.mentions[0].staticAvatarURL.replace("jpg?size=128", "png?size=2048");
    }

    if (/(https?:\/\/.*\.(?:png|jpg|jpeg))/g.test(ctx.content)) {
        url = ctx.content;
    }

    if (message.attachments.length && image.test(message.attachments[0].url)) {
        url = message.attachments[0].url;
    }

    if (!url) {
        return ctx.failure(ctx.strings.get("pls_no_image"))
    }

    let img = await snekfetch.get(url);
    
    try {
        await ctx.client.fs.mkdirAsync("guilds");
    } catch (error) {
        if (error.code != "EEXIST") throw error;
    }
    
    try {
        await ctx.client.fs.mkdirAsync(`guilds/${message.channel.guild.id}`);
    } catch (error) {
        if (error.code != "EEXIST") throw error;
    }

    let filename = `guilds/${message.channel.guild.id}/${message.id}.png`;
    await ctx.client.fs.writeFileAsync(filename, img.body);

    ctx.success(ctx.strings.get("pls_success", filename));
    return img.body;
}

module.exports = {
    name: "pls",
    aliases: ["upload"],
    typing: true,
    category: "rotate",
    checks,
    exec
};
