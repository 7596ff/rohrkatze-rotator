async function exec(message, ctx) {
    let roles = message.channel.guild.roles.map((role) => [role.id, role.name].join(" - "));

    while (roles.length > 0) {
        let collector = [];

        while (collector.join("\n").length < 1900) {
            collector.push(roles.splice(0, 1)[0]);
        }

        await ctx.code("prolog", collector.join("\n"));
    }
}

module.exports = {
    name: "roles",
    category: "utility",
    exec
};
