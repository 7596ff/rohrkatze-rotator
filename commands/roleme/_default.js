async function exec(message, ctx) {
    let roles = await ctx.client.util.getRoles(ctx.client.pg, message.channel.guild);

    let selected = ctx.client.util.checkMatch(roles.map((role) => role.name), ctx.content);
    if (selected) {
        await message.channel.guild.addMemberRole(
            message.member.id,
            roles.find((role) => role.name === selected).id,
            "Automated roleme grant"
        );

        return message.addReaction("greenTick:357246808767987712");
    } else {
        return ctx.failure(ctx.strings.get("roleme_add_no_roles"));
    }
}

module.exports = {
    name: "add",
    category: "settings",
    exec
};
