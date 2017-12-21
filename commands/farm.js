async function exec(message, ctx) {
    let member = message.author.id;

    if (ctx.content.length) {
        member = ctx.findMember(ctx.content);
        if (!member) return ctx.send(ctx.strings.get("bot_no_member"));
    }

    let discrim = ctx.client.bot.users.get(member).discriminator;
    if (ctx.content.length === 4 && !isNaN(ctx.content)) {
        discrim = parseInt(ctx.content);
    }

    let map = ctx.client.bot.users
        .filter((user) => user.discriminator == discrim)
        .map((user) => `${user.username}#${user.discriminator}`)
        .join(", ");
    
    return ctx.code("js", map);
}

module.exports = {
    name: "farm",
    aliases: ["discrim"],
    category: "utility",
    exec
};
