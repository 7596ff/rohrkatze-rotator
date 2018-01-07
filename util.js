const FuzzySet = require("fuzzyset.js");
const Jimp = require("jimp");

module.exports = {
    today: function(now)  {
        if (!now) now = new Date();
        return `${now.getFullYear()}${("00" + now.getMonth()).slice(-2)}${("00" + now.getDate()).slice(-2)}`;
    },
    rand: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    rotate: async function(client, guild) {
        let data;
        try {
            data = await this.getFolder(client, guild);
        } catch (error) {
            return error;
        }

        let row = await client.getGuild(guild.id);
        data.folder = data.folder.filter((file) => !file.includes(row.current));
        let chosen = this.rand(folder);
        let image = await client.fs.readFileAsync(`${data.path}/${chosen}`);

        if (row.meme && Math.floor(Math.random() * 10) === 0) {
            image = await this.meme(image);
        }

        await guild.edit({
            icon: "data:image/jpg;base64," + image.toString("base64")
        });

        await client.pg.query({
            text: "UPDATE guilds SET current = $1, lasttime = $2 WHERE id = $3;",
            values: [chosen.replace(/\D/g, ""), Date.now(), guild.id]
        });

        delete client.guildCache[guild.id];
        console.log(`${new Date().toJSON()} [${guild.id}/${guild.name}] :: ROTATE`);
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

            if (folder.length === 0) {
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
    getRoles: async function(pg, guild) {
        let res = await pg.query({
            text: "SELECT * FROM roleme WHERE guild = $1;",
            values: [guild.id]
        });

        let roles = res.rows.map((row) => {
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

                let count = await client.redis.getAsync(key);
                let newCount = Math.floor(count * 0.7);
                await client.redis.setAsync(key, newCount);

                if (newCount > 10) continue;

                await client.redis.setAsync(key, 0);
                try {
                    await member.removeRole(row.activity);
                } catch (error) {
                    console.error(`${guild.id}/${guild.name} - ${member.id}/${member.username}`);
                    console.error(error.response);
                }

                amount += 1;
            }
        }

        if (amount > 0) console.log(`${new Date().toJSON()} removed ${amount} roles from ${rows.length} different guilds`);
    },
    decayEmojis: async function(client) {
        let week = this.lastWeek().map((key) => `emojis:${key}`);
        let keys = await client.redis.keysAsync("emojis:*");
        let old = keys.filter((key) => !week.includes(key));
        await client.redis.delAsync(...old);
        console.log(`${new Date().toJSON()} deleted ${old.length} emoji sets`);
    },
    lastWeek: function() {
        return "0123456"
            .split("")
            .map((n) => {
                let d = new Date();
                d.setDate(d.getDate() - n);

                return this.today(d);
            });
    }
};
