async function exec(message, ctx) {
    if (!ctx.options[1] || isNaN(ctx.options[1])) {
        return ctx.failure(ctx.strings.get("star_show_failure"));
    }

    let res = await ctx.client.pg.query({
        text: "SELECT * FROM who WHERE message = $1;",
        values: [ctx.options[1]]
    });

    if (res.rows.length === 0) {
        return ctx.failure(ctx.strings.get("pin_no_message"));
    }

    let names = res.rows
        .map((row) => row.member)
        .map((member) => message.channel.guild.members.get(member))
        .map((member) => member ? `${member.username}#${member.discriminator}` : "Unknown Member")
        .join(", ");

    return ctx.send(names);
}

module.exports = {
    name: "who",
    category: "starboard",
    typing: true,
    exec
};
