async function exec(message, ctx) {
    if (!(ctx.row.pinboardin && ctx.row.pinboardout)) {
        return ctx.failure(ctx.strings.get("migratepins_no_pinboard"));
    }

    let pins = await message.channel.guild.channels.get(ctx.row.pinboardin).getPins();
    pins = pins.reverse();
    
    for (let pin of pins) {
        if (!pin.member) continue;
        let result = await ctx.client.commands.star.subcommands.show.embed(null, { message: pin });
        await ctx.client.bot.createMessage(ctx.row.pinboardout, { embed: result });
    }

    return ctx.success(ctx.strings.get("migratepins_success"));
}

async function checks(member, ctx) {
    return member.permission.has("manageGuild");
}

module.exports = {
    name: "migratepins",
    category: "utility",
    typing: true,
    checks,
    exec
};
