async function exec(message, ctx) {
    if (!ctx.options[0] || !message.channel.guild.roles.get(ctx.options[0])) {
        return ctx.failure(ctx.strings.get("link_no_role"));
    }

    let invite = await message.channel.createInvite({ maxAge: 0 });
    await ctx.client.pg.query({
        text: [
            "INSERT INTO ROLES VALUES ($1, $2, $3) ON CONFLICT (role) DO", 
            "UPDATE SET invitecode = $2 WHERE roles.role = $1;"
        ].join(" "),
        values: [ctx.options[0], invite.code, message.channel.guild.id]
    });
    
    ctx.client.watchedCodes.push(invite.code);
    ctx.client.invites.set(invite.code, invite);

    return ctx.success(`https://discord.gg/${invite.code}`);
}

async function checks(member, ctx) {
    return member.permission.has("manageGuild");
}

module.exports = {
    name: "link",
    category: "utility",
    checks,
    exec
};
