async function exec(message, ctx) {
    let timeout = parseInt(ctx.content);
    if (!isNaN(timeout) && timeout > 0 && timeout <= 24) {
        await ctx.client.pg.query({
            text: "UPDATE guilds SET timeout = $1 WHERE id = $2;",
            values: [timeout, message.channel.guild.id]
        });
        delete ctx.client.guildCache[message.channel.guild.id];
        return ctx.success("");
    } else {
        return ctx.failure(ctx.strings.get("timeout_bad_format"));
    }
}

async function checks(member, ctx) {
    return member.permission.has("manageGuild");
}

module.exports = {
    name: "timeout",
    category: "rotate",
    checks,
    exec
};
