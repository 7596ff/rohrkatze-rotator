async function exec(message, ctx) {
    if (!ctx.content.length) {
        return ctx.send(ctx.strings.get("starboard_emoji_none"));
    }

    let emoji = ctx.content.match(/<:.+:\d+>/) ? ctx.content.slice(8).slice(0, -1) : ctx.content.slice(6);

    await ctx.client.pg.query({
        text: "UPDATE guilds SET emoji = $1 WHERE id = $2;",
        values: [emoji, message.channel.guild.id]
    });

    delete ctx.client.guildCache[message.channel.guild.id];

    return ctx.success(ctx.strings.get("starboard_emoji_success", emoji));
}

async function checks(member, ctx) {
    return member.permission.has("manageMessages");
}

module.exports = {
    name: "emoji",
    category: "starboard",
    checks,
    exec
};
