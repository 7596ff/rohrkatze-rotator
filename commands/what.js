async function exec(message, ctx) {
    let data;
    try {
        data = await ctx.client.util.getFolder(ctx.client, message.channel.guild);
    } catch (error) {
        if (error === "one_image") {
            return ctx.failure(ctx.strings.get("rotate_one_image"));
        } else if (error === "no_images") {
            return ctx.failure(ctx.strings.get("rotate_no_images"));
        }
    }

    let name = data.folder.find((file) => file.replace(/\D/g, "") == ctx.row.current);
    let image = await ctx.client.fs.readFileAsync(path = `${data.path}/${name}`);

    return ctx.send(name, { name: "image.png", file: image });
}

module.exports = {
    name: "what",
    aliases: ["wat", "which"],
    typing: true,
    exec
};
