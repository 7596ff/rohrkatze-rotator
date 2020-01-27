let hex = /#*([A-Fa-f0-9]{6})$/g;

async function exec(message, ctx) {
    if (!hex.test(ctx.options[1])) {
        return ctx.failure(ctx.strings.get("colorme_invalid_hex", ctx.options[1]));
    }

    let color = parseInt(ctx.options[1].toUpperCase(), 16);
    let colorHex = color.toString(16);

    let role = await message.channel.guild.createRole({
        name: ctx.options.slice(2).join(" "),
        permissions: 0,
        color,
        mentionable: false
    }, "Automated colorme role creation");

    await ctx.client.pg.query({
        text: "INSERT INTO roleme (id, guild, color) VALUES ($1, $2, $3);",
        values: [role.id, message.channel.guild.id, colorHex]
    });

    return ctx.success(ctx.strings.get("colorme_create", role.name, colorHex));
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
