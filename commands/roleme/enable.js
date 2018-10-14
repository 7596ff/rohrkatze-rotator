async function exec(message, ctx) {
    let match = ctx.client.util.checkMatch(
        message.channel.guild.roles.map((role) => role.name),
        ctx.options.slice(1).join(" ")
    );

    let role = message.channel.guild.roles.find((role) => role.name == match);
    if (!role) {
        return ctx.failure(ctx.strings.get("roleme_enable_no_role"));
    }

    try {
        await ctx.client.pg.query({
            text: "INSERT INTO roleme (id, guild) VALUES ($1, $2);",
            values: [role.id, message.channel.guild.id]
        });
    
    } catch (error) {
        if (error.code === "23505") {
            return ctx.failure(ctx.strings.get("roleme_enable_already"));
        } else {
            throw error;
        }
    }

    return message.addReaction("greenTick:357246808767987712");
}

async function checks(member, ctx) {
    return member.permission.has("manageRoles");
}

module.exports = {
    name: "enable",
    category: "settings",
    checks,
    exec
};
