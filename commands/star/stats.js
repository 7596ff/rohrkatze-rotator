const trophies = ["🥇", "🥈", "🥉"];

function memberFreqency(stars) {
    let res = stars.map((star) => star.member);
    let unique = res.filter((item, index, array) => array.indexOf(item) === index);
    
    return unique
        .map((item) => {
            return {
                id: item,
                stars: res.filter((stars) => stars === item).length
            };
        })
        .sort((a, b) => b.stars - a.stars);
}

async function embed(ctx, data) {
    return {
        author: {
            icon_url: data.guild.iconURL,
            name: ctx.strings.get("star_stats_title", data.guild.name)
        },
        fields: [{
            name: ctx.strings.get("star_stats_top_stars"),
            value: data.stars
                .slice(0, 3)
                .map((row, index) => `${trophies[index]} **${row.stars}** :star: \`${row.message}\` by <@${row.member}>`)
                .join("\n"),
            inline: false
        }, {
            name: ctx.strings.get("star_stats_top_members"),
            value: data.members
                .slice(0, 3)
                .map((member, index) => `${trophies[index]} <@${member.id}> with **${member.stars}** stars`)
                .join("\n"),
            inline: true
        }, {
            name: ctx.strings.get("star_stats_top_starrers"),
            value: data.starrers
                .slice(0, 3)
                .map((member, index) => `${trophies[index]} <@${member.id}> with **${member.stars}** stars`)
                .join("\n"),
            inline: true
        }],
        footer: {
            text: ctx.strings.get("star_stats_footer")
        }
    };
}

async function exec(message, ctx) {
    let res = await ctx.client.pg.query({
        text: "SELECT * FROM starboard WHERE guild = $1 ORDER BY stars DESC;",
        values: [message.channel.guild.id]
    });

    if (res.rows.length < 1) {
        return ctx.failure(ctx.strings.get("star_stats_not_enough_stars"))
    }

    let whores = await ctx.client.pg.query("SELECT * FROM who;");

    let stars = res.rows;
    let who = whores.rows.filter((row) => stars.find((star) => star.message == row.message));
    
    let result = await embed(ctx, {
        guild: message.channel.guild,
        stars,
        members: memberFreqency(stars),
        starrers: memberFreqency(who)
    });

    return ctx.embed(result);
}

module.exports = {
    name: "stats",
    category: "starboard",
    typing: true,
    exec
};
