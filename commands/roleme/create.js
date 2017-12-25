async function exec(message, ctx) {
    let role = await message.channel.guild.createRole({
        name: ctx.options.slice(1).join(" "),
        permissions: 0,
        mentionable: false
    }, "Automated roleme role creation");

    await ctx.client.pg.query({
        text: "INSERT INTO roleme (id, guild) VALUES ($1, $2);",
        values: [role.id, message.channel.guild.id]
    });

    return ctx.success(ctx.strings.get("roleme_create", role.name));
}

async function checks(member, ctx) {
    return member.permission.has("manageRoles");
}

module.exports = {
    name: "create",
    category: "settings",
    checks,
    exec
};
