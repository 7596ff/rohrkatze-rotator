async function exec(message, ctx) {
    let dates = ctx.client.util.lastWeek();

    let promises = dates.map((date) => ctx.client.redis.zrevrangebyscore(`emojis:${date}`, "Infinity", "-Infinity", "WITHSCORES"));
    let results = await Promise.all(promises);

    let guildEmoji = {};

    for (let emoji of message.channel.guild.emojis) {
        guildEmoji[emoji.id] = {
            count: 0,
            format: `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`,
        };
    }

    for (let day of results) {
        for (let i = 0; i < day.length; i += 2) {
            if (!guildEmoji[day[i]]) continue;
            guildEmoji[day[i]].count += Number(day[i + 1]);
        }
    }

    guildEmoji = Object.values(guildEmoji).sort((a, b) => b.count - a.count);

    if (message.content.split(" ")[1] == "all") {
        let map = guildEmoji.map((item) => `\`${item.count}\` ${item.format}`);

        let msg = [];

        while (map.length > 0) {
            let resp = [];
            while (resp.join("\n").length < 1500) {
                resp.push(map.splice(0, 10).join(", "));
            }

            msg.push(resp);
        }

        msg[0].unshift("", ctx.strings.get("emoji_top_10"));

        while (msg.length > 0) {
            let result = msg.splice(0, 1)[0];
            ctx.send(result.join("\n"));
        }
    } else {
        let resp = [ctx.strings.get("emoji_top_all"), ""];
        resp.push(...guildEmoji.slice(0, 10).map((item, index) => `\`${index + 1}.\` ${item.format} with \`${item.count}\` uses`));

        message.channel.createMessage(resp.join("\n"));
    }
}

module.exports = {
    name: "emojis", 
    category: "utility",
    exec
};
