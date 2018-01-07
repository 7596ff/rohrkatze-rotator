async function exec(message, ctx) {
    let data;
    try {
        data = await ctx.client.util.getFolder(ctx.client, message.channel.guild);
    } catch (error) {
        if (error === "no_images") {
            return ctx.failure(ctx.strings.get("rotate_no_images"));
        }
    }

    let target = ctx.content.replace(/\D/g, "");
    if (!target.length) return ctx.failure(ctx.strings.get("show_no_image"));

    let found = data.folder.find((filename) => filename.includes(target));
    if (!found) return ctx.failure(ctx.strings.get("show_no_image"));

    let image = await ctx.client.fs.readFileAsync(`${data.path}/${found}`);

    return ctx.send(found, {
        name: found,
        file: image
    });
}

module.exports = {
    name: "show",
    category: "rotate",
    typing: true,
    exec
};
