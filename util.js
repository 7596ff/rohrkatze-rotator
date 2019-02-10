const FuzzySet = require("fuzzyset.js");
const Jimp = require("jimp");

const queue = [];
var queueStarted = false;

module.exports = {
    today: function(now, hr)  {
        if (!now) now = new Date();
        return `${now.getFullYear()}${("00" + (1 + now.getMonth())).slice(-2)}${("00" + now.getDate()).slice(-2)}${hr ? now.getHours() : ""}`;
    },
    rand: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    sleep: function(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    },
    processQueue: async function() {
        let data = queue.pop();
        await data.guild.edit({ icon: data.icon });
    },
    startQueue: async function() {
        while (queue.length > 0) {
            await this.processQueue();
            await this.sleep(1000);
        }
        queueStarted = false;
    },
    delay: async function(guild, icon) {
        queue.push({ guild, icon });
        if (queueStarted) return;
        queueStarted = true;
        this.startQueue();
    },
    rotate: async function(client, guild, override) {
        let data = await this.getFolder(client, guild);

        let row = await client.getGuild(guild.id);
        data.folder = data.folder.filter((file) => !file.includes(row.current));
        let chosen = this.rand(data.folder);
        if (override) chosen = override;
        let image = await client.fs.readFileAsync(`${data.path}/${chosen}`);

        if (row.meme && Math.floor(Math.random() * 10) === 0) {
            image = await this.meme(image);
        }

        // await this.delay(guild, "data:image/jpg;base64," + image.toString("base64"));
        await guild.edit({
            icon: "data:image/jpg;base64," + image.toString("base64")
        });

        await client.pg.query({
            text: "UPDATE guilds SET current = $1, lasttime = $2 WHERE id = $3;",
            values: [chosen.replace(/\D/g, ""), Date.now(), guild.id]
        });

        delete client.guildCache[guild.id];
        console.log(`${new Date().toJSON()} [${guild.id}/${guild.name}] :: ROTATE`); // eslint-disable-line no-console
    },
    meme: async function(image) {
        let base = await Jimp.read(image);
        let meme = await Jimp.read("./fake_notify.png");

        await base.resize(128, 128);
        await base.composite(meme, 0, 0);

        let result = await base.getBuffer(Jimp.MIME_PNG);
        return result;
    },
    getFolder: async function(client, guild) {
        let folder, path;
        try {
            folder = await client.fs.readdirAsync(path = `./guilds/${guild.id}`);

            if (!folder || folder.length === 0) {
                throw "no_images";
            } else if (folder.length === 1) {
                throw "one_image";
            }
        } catch (error) {
            if (error.code === "ENOENT") {
                throw "no_images";
            }
            
            throw error;
        }

        return { folder, path };
    },
    checkMatch(names, name) {
        names = new FuzzySet(names);
        let match = names.get(name);
        match = match ? (match[0] || false) : false;
        if (!match) return false;
        return match[0] > 0.8 && match[1];
    },
    getRoles: async function(pg, guild, color) {
        let res = await pg.query({
            text: "SELECT * FROM roleme WHERE guild = $1;",
            values: [guild.id]
        });

        let roles = res.rows
            .filter((row) => !!color === !!row.color)
            .map((row) => {
                return { id: row.id, role: guild.roles.get(row.id) };
            });

        let expired = roles.filter((role) => !role.role);
        if (expired.length) await Promise.all(expired.map((role) => pg.query({
            text: "DELETE FROM roleme WHERE id = $1;",
            values: [role.id]
        })));

        return roles
            .filter((role) => role.role)
            .map((role) => role.role);
    },
    decayActivity: async function(client) {
        let res = await client.pg.query("SELECT id, activity FROM guilds;");
        let rows = res.rows.filter((row) => row.activity && row.activity != 0);

        let amount = 0;

        for (let row of rows) {
            let guild = client.bot.guilds.get(row.id);
            if (!guild) continue;

            if (!guild.roles.get(row.activity)) continue;

            let members = guild.members.filter((member) => member.roles.includes(row.activity));
            if (!members.length) continue;

            for (let member of members) {
                let key = `katze:activity:${row.id}:${member.id}`;

                let count = await client.redis.get(key);
                let newCount = Math.floor(count * 0.7);
                await client.redis.set(key, newCount);

                if (newCount > 10) continue;

                await client.redis.set(key, 0);
                try {
                    await member.removeRole(row.activity);
                } catch (error) {
                    console.error(`${guild.id}/${guild.name} - ${member.id}/${member.username}`); // eslint-disable-line no-console
                    console.error(error.response); // eslint-disable-line no-console
                }

                amount += 1;
            }
        }

        if (amount > 0) console.log(`${new Date().toJSON()} removed ${amount} roles from ${rows.length} different guilds`); // eslint-disable-line no-console
    },
    decayEmojis: async function(client) {
        let week = this.lastWeek().map((key) => `emojis:${key}`);
        let keys = await client.redis.keys("emojis:*");
        let old = keys.filter((key) => !week.includes(key));
        await client.redis.del(...old);
        console.log(`${new Date().toJSON()} deleted ${old.length} emoji sets`); // eslint-disable-line no-console
    },
    lastWeek: function() {
        return "0123456"
            .split("")
            .map((n) => {
                let d = new Date();
                d.setDate(d.getDate() - n);

                return this.today(d);
            });
    },
    void: async function(client) {
        let now = new Date();
        now.setDate(now.getDate() - 1);
        let key = `katze:void:*:${this.today(now, true)}`;

        let count = 0;
        let sets = await client.redis.keys(key);
        for (let set of sets) {
            let channelID = set.split(":")[2];

            while (true) {
                let messages = [];

                while (messages.length < 200) {
                    let id = await client.redis.lpop(set);

		    if (id) {
                       messages.push(id);
		    } else {
		        break;
		    }

                    count += 1;
                }

                await client.bot.deleteMessages(channelID, messages, "void channel");

                let first_item = await client.redis.lpop(set);

                if (first_item) {
                    messages.push(first_item);
		} else {
                    break;
		}

                count += 1;
            }
        }

        return count;
    }
};

