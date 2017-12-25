async function exec(message, ctx) {
    let { error, folder, path } = await ctx.client.util.getFolder(ctx.client, message.channel.guild);

    if (error === "no_images") {
        return ctx.failure(ctx.strings.get("rotate_no_images"));
    }

    let target = ctx.content.replace(/\D/g, "");
    if (!target.length) return ctx.failure(ctx.strings.get("show_no_image"));

    let found = folder.find((filename) => filename.includes(target));
    if (!found) return ctx.failure(ctx.strings.get("show_no_image"));

    let image = await ctx.client.fs.readFileAsync(path = `${path}/${found}`);
    await ctx.client.fs.unlinkAsync(path);

    return ctx.send(ctx.strings.get("delete_success", found), {
        name: found,
        file: image
    });
}

async function checks(member, ctx) {
    return member.permission.has("manageGuild");
}

module.exports = {
    name: "delete",
    category: "rotate",
    aliases: ["remove"],
    typing: true,
    checks,
    exec
};
