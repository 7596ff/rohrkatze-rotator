async function exec(message, ctx) {
    let roles = await ctx.client.util.getRoles(ctx.client.pg, message.channel.guild);
    let match = ctx.client.util.checkMatch(roles.map((role) => role.name), ctx.options.slice(1).join(""));

    if (!match) return ctx.failure(ctx.strings.get("roleme_add_no_roles"));

    await ctx.client.pg.query({
        text: "DELETE FROM roleme WHERE id = $1;",
        values: [roles.find((role) => role.name == match).id]
    });

    return message.addReaction("greenTick:357246808767987712");
}

async function checks(member, ctx) {
    return member.permission.has("manageRoles");
}

module.exports = {
    name: "disable",
    category: "settings",
    checks,
    exec
};
