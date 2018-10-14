async function exec(message, ctx) {
    let roles = await ctx.client.util.getRoles(ctx.client.pg, message.channel.guild, false);
    let msg = roles.map((role) => `- \`${role.name}\``);
    msg.unshift("\n", ctx.strings.get("roleme_list"));
    ctx.send(msg.join("\n"));
}

module.exports = {
    name: "list",
    category: "settings",
    exec
};
