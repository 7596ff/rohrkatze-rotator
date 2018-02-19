async function exec(message, ctx) {
    let data;
    try {
        data = await ctx.client.util.getFolder(ctx.client, message.channel.guild);
    } catch (error) {
        if (error === "no_images") {
            return ctx.failure(ctx.strings.get("rotate_no_images"));
        }
    }

    let count = data ? data.folder.length : 1;
    return ctx.send(ctx.strings.get("count_how_many", count));
}

module.exports = {
    name: "count",
    category: "rotate",
    exec
};
