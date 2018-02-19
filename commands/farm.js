async function exec(message, ctx) {
    let member, discrim;

    if (ctx.content.length) {
        member = ctx.findMember(ctx.content);
        if (!member) {
            if (ctx.content.length == 4 && !isNaN(parseInt(ctx.content))) { // assume its a number
                discrim = ctx.content;
            } else {
                return ctx.send(ctx.strings.get("bot_no_member"));
            }
        }
    } else {
        member = message.author.id;
    }

    if (!discrim) discrim = ctx.client.bot.users.get(member).discriminator;
    if (ctx.content.length === 4 && !isNaN(ctx.content)) {
        discrim = parseInt(ctx.content);
    }

    let map = ctx.client.bot.users
        .filter((user) => user.discriminator == discrim)
        .map((user) => `${user.username}#${user.discriminator}`);
    
    let msg = [];

    while (map.length > 0) {
        let element = [];
        while (element.join(", ").length < 1900 && map.length > 0) {
            element.push(map.splice(0, 1)[0]);
        }
        
        msg.push(element.join(", "));
    }
    
    for (let element of msg) {
        await ctx.code("js", element);
    }
}

module.exports = {
    name: "farm",
    aliases: ["discrim"],
    category: "utility",
    exec
};
