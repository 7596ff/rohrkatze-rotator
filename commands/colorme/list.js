async function exec(message, ctx) {
    let roles = await ctx.client.util.getRoles(ctx.client.pg, message.channel.guild, true);
    let msg = roles.map((role) => `- \`${role.name}\` (#${role.color.toString(16)})`);
    msg.unshift("\n", ctx.strings.get("colorme_list"));
    ctx.send(msg.join("\n"));
}

module.exports = {
    name: "list",
    category: "settings",
    exec
};
