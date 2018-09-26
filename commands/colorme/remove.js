async function exec(message, ctx) {
    let roles = await ctx.client.util.getRoles(ctx.client.pg, message.channel.guild, true);
    let match = ctx.client.util.checkMatch(roles.map((role) => role.name), ctx.options.slice(1).join(""));

    if (!match) return ctx.failure(ctx.strings.get("roleme_add_no_roles"));

    await message.channel.guild.removeMemberRole(
        message.member.id,
        roles.find((role) => role.name == match).id,
        "Automated colorme role removal"
    );

    return message.addReaction("greenTick:357246808767987712");
}

module.exports = {
    name: "remove",
    category: "settings",
    exec
};
