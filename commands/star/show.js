async function embed(ctx, data) {
    let embed = {
        author: {
            icon_url: data.message.member.avatarURL,
            name: data.message.member.nick || data.message.member.username
        },
        description: data.message.content  || "",
        footer: {
            text: `ID: ${data.message.id}`
        },
        timestamp: new Date(data.message.timestamp)
    };

    if (data.message.member.roles.length > 0) {
        let colorRole = data.message.member.roles
            .map((role) => data.message.channel.guild.roles.get(role))
            .sort((a, b) => b.position - a.position)
            .find((role) => role.color != 0)
        embed.color = colorRole ? colorRole.color : 0;
    }

    let matches = data.message.content.match(/(https?:\/\/.*\.(?:png|jpg|gif|jpeg))/g);
    if (matches) embed.image = { url: matches[0] };

    if (data.message.attachments.length > 0) {
        if (data.message.attachments[0].url.match(/(https?:\/\/.*\.(?:png|jpg|gif|jpeg))/g)) {
            embed.image = { "url": data.message.attachments[0].url };
        }

        embed.description += ` [Attachment](${data.message.attachments[0].url})`;
    }

    return embed;
}

async function exec(message, ctx) {
    if (!ctx.options[1] || isNaN(ctx.options[1])) {
        return ctx.failure(ctx.strings.get("star_show_failure"));
    }

    let res = await ctx.client.pg.query({
        text: "SELECT * FROM starboard WHERE message = $1;",
        values: [ctx.options[1]]
    });

    if (res.rows.length < 1) {
        return ctx.failure(ctx.strings.get("star_show_not_found"))
    }

    let row = res.rows[0];
    let msg = await ctx.client.bot.getMessage(row.channel, row.message);

    let result = await embed(null, { message: msg });
    return ctx.send({
        content: `⭐ **${row.stars}** ${msg.channel.mention}`,
        embed: result
    });
}

module.exports = {
    name: "show",
    category: "starboard",
    typing: true,
    embed,
    exec
};
