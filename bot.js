const config = require("./config.json");
const Casca = require("casca");
const Redis = require("redis");
const CronJob = require("cron").CronJob;
require("bluebird").promisifyAll(Redis);

// monkaS
require("jimp").prototype.getBuffer = require("bluebird").promisify(require("jimp").prototype.getBuffer);

const client = new Casca(config);
client.redis = Redis.createClient();
client.util = require("./util");
client.fs = require("bluebird").promisifyAll(require("fs"));
client.jobs = { rotations: {} };
client.watchedCodes = [];
client.invites = new Map();

rsub = Redis.createClient();
rsub.subscribe("__keyevent@0__:expired");

client.on("ready", () => {
    console.log(new Date().toJSON() + " Ready.");
});

client.once("ready", () => {
    client.bot.guilds.forEach((guild) => {
        client.getGuild(guild.id).then((row) => {
            client.jobs.rotations[guild.id] = new CronJob(
                `0 */${row.timeout || 12} * * *`,
                () => {
                    client.getGuild(guild.id).then((row) => {
                        if (!row.dont) client.util.rotate(client, guild).catch((error) => console.error(error));
                    });
                },
                null,
                true
            );
        }).catch((error) => {
            console.error(error);
            console.error(`couldn't get guild ${guild.id}`);
        });

        guild.getInvites().then((invites) => {
            invites.forEach((invite) => {
                client.invites.set(invite.code, invite);
            });
        }).catch((error) => null);
    });

    client.pg.query("SELECT * FROM roles;").then((res) => {
        client.watchedCodes.push(...res.rows.map((row) => row.invitecode));
    }).catch((error) => {
        console.error(error);
        process.exit(1);
    });

    client.jobs.activity = new CronJob("0 * * * *", () => {
        client.util.decayActivity(client).catch(console.error);
    }, null, true);

    client.jobs.cleanup = new CronJob("0 0 * * *", () => {
        client.util.decayEmojis(client).catch(console.error);
    }, null, true);
});

client.on("info", (message) => {
    console.log(`${new Date().toJSON()} ${message}`);
});

client.on("bot", (message) => {
    console.log(`${new Date().toJSON()} ${message}`);
});

client.on("error", (status, error) => {
    console.error(error);
    console.error(`${new Date().toJSON()} ${status.text}`);
});

client.on("command", (output, result) => {
    console.log(`${new Date().toJSON()} [${output.guild.id}/${output.guild.name}]-[${output.channel.id}/${output.channel.name}] :: COMMAND ${output.text} (${output.ctx.content})`);

    if (output.text == "pls") {
        output.guild.edit({
            icon: "data:image/jpg;base64," + result.toString("base64")
        }).catch((error) => null);
    }

    if (output.text == "starboard/starboard") {
        delete client.guildCache[output.guild.id];
    }
});

let customEmoji = /<a?:[a-zA-Z1-9-_]{2,}:\d{17,20}>/g;

async function processPin(message) {
    let row;
    try {
        row = await client.getGuild(message.channel.guild.id);
    } catch (error) {
        console.error(error);
        console.error("error in getGuild on processPin");
    }

    if (!(row.pinboardin && row.pinboardout)) return;
    if (message.channel.id !== row.pinboardin) return;

    try {
        let pins = await message.channel.getPins();
        let embed = await client.commands.star.subcommands.show.embed(null, { message: pins[0] });
        await client.bot.createMessage(row.pinboardout, { embed });

        if (row.cleanpins && pins.length > 49) {
            await client.bot.unpinMessage(row.pinboardin, pins[pins.length - 1].id);
        }
    } catch (error) {
        console.error(error);
        console.error(new Date().toJSON() + " error in processPin");
    }
}

const methods = {
    scoreEmojis: async function(message) {
        if (message.author.bot) return;
    
        let emojis = message.content.match(customEmoji);
        if (!emojis) return;
    
        let ymd = `emojis:${client.util.today()}`;
    
        for (let emoji of emojis) {
            let id = emoji.split(":")[2].slice(0, -1);
            if (!message.channel.guild.emojis.find((emoji) => emoji.id == id)) return;
            await client.redis.zincrbyAsync(ymd, 1, id);
        }
    },
    addActivity: async function(message) {
        if (message.author.bot) return;

        let row = await client.getGuild(message.channel.guild.id);
        if (!row.activity) return;

        let key = `katze:activity:${message.channel.guild.id}:${message.member.id}`;

        await client.redis.incrAsync(key);

        if (!~message.member.roles.indexOf(row.activity)) {
            if (message.channel.guild.roles.get(row.activity)) {
                try { await message.member.addRole(row.activity); } catch (error) { throw error; }
            } else {
                await client.pg.query({
                    text: "UPDATE guilds SET activity = null WHERE id = $1;",
                    values: [message.channel.guild.id]
                });
            }
        }
    }
};

client.bot.on("messageCreate", async (message) => {
    if (message.type === 6) return processPin(message);
    if (!message.channel.guild) return;
    
    for (let method in methods) {
        try {
            await methods[method](message);
        } catch (error) {
            console.error(error);
            console.error(`error in ${method}\nchannel id:${message.channel.id} message id:${message.id}`);
        }
    }
});

client.bot.on("messageUpdate", async (message) => {
    try {
        let row = await client.getGuild(message.channel.guild.id);
        if (!row.starboard) return;

        let res = await client.pg.query({
            text: "SELECT * FROM starboard WHERE message = $1;",
            values: [message.id]
        });

        if (res.rows.length < 1) return;
        if (!res.rows[0].post) return;

        let result = await client.commands.star.subcommands.show.embed(null, { message });
        await client.bot.editMessage(row.starboard, res.rows[0].post, {
            content: `⭐ **${res.rows[0].stars}** ${message.channel.mention}`,
            embed: result
        });
    } catch (error) {
        console.error(error);
        console.error(`channel id:${message.channel.id} message id:${message.id}`);
    }
});

client.bot.on("messageDelete", async (message) => {
    try {
        let row = await client.getGuild(message.channel.guild.id);
        if (!row.starboard) return;

        let res = await client.pg.query({
            text: "DELETE FROM starboard WHERE message = $1 RETURNING *;",
            values: [message.id]
        });

        if (res.rows.length < 1) return;
        if (!res.rows[0].post) return;

        await client.bot.deleteMessage(row.starboard, res.rows[0].post);
    } catch (error) {
        console.error(error);
        console.error(`channel id:${message.channel.id} message id:${message.id}`);
    }
});

// bulk of starboard logic
async function onReactionChange(message, emoji, userID, add) {
    emoji = emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name;

    guildID = client.bot.channelGuildMap[message.channel.id];
    if (!guildID) return;

    if (!message.member || !message.content) {
        try {
            message = await client.bot.getMessage(message.channel.id, message.id);
        } catch (error) {
            return;
        }
    }

    let guild = await client.getGuild(guildID);

    if (!guild.starboard || guild.starboard === 0) return;
    if (emoji !== guild.emoji) return;
    if (message.author.id == userID) return;

    if (message.channel.id === guild.starboard) {
        if (add === false) return;
        if (!client.bot.guilds.get(guildID).members.get(client.bot.user.id).permission.has("manageMessages")) return;

        let res = await client.pg.query({
            text: "SELECT * FROM starboard WHERE post = $1;",
            values: [message.id]
        });

        let status = res.rows[0];

        await client.bot.removeMessageReaction(message.channel.id, message.id, emoji, userID);
        let msg = await client.bot.getMessage(status.channel, status.message);
        return onReactionChange(msg, { name: emoji }, userID, true);
    }

    let status = await client.pg.query({
        text: "SELECT * FROM starboard WHERE message = $1;",
        values: [message.id]
    });

    let row = false;
    if (add === true) {
        try {
            await client.pg.query({
                text: "INSERT INTO who (message, member) VALUES ($1, $2);",
                values: [message.id, userID]
            });
        } catch (error) {
            if (error.code !== "23505") throw error;
        }

        let res = await client.pg.query({
            text: [
                "INSERT INTO starboard (date, guild, member, channel, message, stars)",
                "VALUES ($1, $2, $3, $4, $5, 1)",
                "ON CONFLICT (message) DO",
                "UPDATE SET stars = (SELECT count(*) FROM who WHERE message = $5) WHERE starboard.message = $5",
                "RETURNING *;"
            ].join(" "),
            values: [message.timestamp, message.channel.guild.id, message.author.id, message.channel.id, message.id]
        });

        row = res.rows[0];
    } else if (add === false) {
        await client.pg.query({
            text: "DELETE FROM who WHERE message = $1 AND member = $2;",
            values: [message.id, userID]
        });

        let res = await client.pg.query({
            text: "UPDATE starboard SET stars = (SELECT count(*) FROM who WHERE message = $1) WHERE message = $1 RETURNING *;",
            values: [message.id]
        });

        row = res.rows[0];

        if (res.rows[0].stars === 0) {
            await client.pg.query({
                text: "DELETE FROM starboard WHERE message = $1;",
                values: [message.id]
            });
        }
    }

    let embed = await client.commands.star.subcommands.show.embed(null, { message });
    let msg = {
        content: `⭐ **${row.stars}** ${message.channel.mention}`,
        embed
    };

    try {
        if (row.stars === 0) {
            await client.bot.deleteMessage(guild.starboard, row.post);
        } else if (row.post) {
            await client.bot.editMessage(guild.starboard, row.post, msg);
        } else {
            let post = await client.bot.createMessage(guild.starboard, msg);
            await client.pg.query({
                text: "UPDATE starboard SET post = $1 WHERE message = $2;",
                values: [post.id, message.id]
            });
        }
    } catch (error) {
        console.error(error);
    }
}

client.bot.on("messageReactionAdd", (message, emoji, userID) => onReactionChange(message, emoji, userID, true));
client.bot.on("messageReactionRemove", (message, emoji, userID) => onReactionChange(message, emoji, userID, false));

const addmethods = {
    rolestate: async function(guild, member) {
        let row = await client.getGuild(guild.id);
        if (!row.rolestate) return;

        let reply = await client.redis.getAsync(`katze:rolestate:${guild.id}:${member.id}`);
        if (reply) reply = JSON.parse(reply);

        if (!reply.length) return;

        for (let role of reply) {
            try { await member.addRole(role); } catch (error) {}
        }
    },
    inviteCode: async function (guild, member) {
        let invites = await guild.getInvites();
        let unique;
        for (let oldInvite of client.invites.values()) {
            let match = invites.find((newInvite) => newInvite.code === oldInvite.code & newInvite.uses > oldInvite.uses);
            if (match) unique = match;
        }

        if (!unique) return;

        client.invites.set(unique.code, unique);
        if (!client.watchedCodes.includes(unique.code)) return;

        let res = await client.pg.query({
            text: "SELECT * FROM roles WHERE invitecode = $1;",
            values: [unique.code]
        });

        await client.bot.addGuildMemberRole(guild.id, member.id, res.rows[0].role);
        console.log(`${new Date().toJSON()} added role to ${member.username} on ${guild.name} (code ${unique.code})`);
    }
}

client.bot.on("guildMemberAdd", async (guild, member) => {
    for (let method in addmethods) {
        try {
            await addmethods[method](guild, member);
        } catch (error) {
            console.error(error);
            console.error(`error on method ${method}\n${guild.id}/${guild.name} - ${member.id}/${member.name}`);
        }
    }
});

client.bot.on("guildMemberRemove", async (guild, member) => {
    client.redis.del(`katze:activity:${guild.id}:${member.id}`);

    if (member.roles) client.redis.set(`katze:rolestate:${guild.id}:${member.id}`, JSON.stringify(member.roles));
});

client.load().then(() => {
    client.connect();
});
