async function exec(message, ctx) {
    let user = message.author.id;

    if (ctx.content.length) {
        user = ctx.findMember(ctx.content);
        if (!user) return ctx.send(ctx.strings.get("bot_no_member"));
    }

    user = ctx.client.bot.users.get(user);
    return ctx.send(user.avatarURL.replace("jpg?size=128", "png?size=2048"));
}

module.exports = {
    name: "avatar",
    category: "utility",
    exec
};
