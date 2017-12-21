const FuzzySet = require("fuzzyset.js");

module.exports = {
    today: function(now)  {
        if (!now) now = new Date();
        return `${now.getFullYear()}${("00" + now.getMonth()).slice(-2)}${("00" + now.getDate()).slice(-2)}`;
    },
    rand: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    rotate: async function(client, guild) {
        let { error, folder, path } = await this.getFolder(client, guild);
        if (error) return error;

        let row = await client.getGuild(guild.id);
        folder = folder.filter((file) => !file.includes(row.current));
        let chosen = this.rand(folder);
        let image = await client.fs.readFileAsync(`${path}/${chosen}`);

        await guild.edit({
            icon: "data:image/jpg;base64," + image.toString("base64")
        });

        await client.pg.query({
            text: "UPDATE guilds SET current = $1 WHERE id = $2;",
            values: [chosen.replace(/\D/g, ""), guild.id]
        });

        delete client.guildCache[guild.id];
        console.log(`${new Date().toJSON()} [${guild.id}/${guild.name}] :: ROTATE`);
    },
    meme: async function() {
        return "aaa"
    },
    getFolder: async function(client, guild) {
        let folder, path;
        try {
            folder = await client.fs.readdirAsync(path = `./guilds/${guild.id}`);

            if (folder.length === 0) {
                return "no_images";
            } else if (folder.length === 1) {
                return "one_image";
            }
        } catch (error) {
            if (error.code === "ENOENT") {
                return "no_images";
            }
            
            throw error;
        }

        return { error: null, folder, path };
    },
    checkMatch(names, name) {
        names = new FuzzySet(names);
        let match = names.get(name);
        match = match ? (match[0] || false) : false;
        if (!match) return false;
        return match[0] > 0.8 && match[1];
    },
    async getRoles(pg, guild) {
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
    }
};
