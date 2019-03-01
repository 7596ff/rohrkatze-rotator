const request = require("snekfetch");

async function exec(message, ctx) {
    let response = await request.get(ctx.content);
    await ctx.client.bot.editSelf( { avatar: "data:image/jpg;base64," + response.body.toString("base64") });
}

async function checks(member, ctx) {
    return member.id == ctx.client.options.owner;
}

module.exports = {
    name: "changeavy",
    category: "owner",
    immune: true,
    checks,
    exec
};
