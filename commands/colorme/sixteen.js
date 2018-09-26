let colors = {
    "Red": "FF8A80",
    "Pink": "FF80AB",
    "Purple": "EA80FC",
    "Deep Purple": "B388FF",
    "Indigo": "8C9EFF",
    "Blue": "82B1FF",
    "Light Blue": "80D8FF",
    "Cyan": "84FFFF",
    "Teal": "A7FFEB",
    "Green": "B9F6CA",
    "Light Green": "CCFF90",
    "Lime": "F4FF81",
    "Yellow": "FFFF8D",
    "Amber": "FFE57F",
    "Orange": "FFD180",
    "Deep Orange": "FF9E80",
};

async function exec(message, ctx) {
    let roles = await Promise.all(Object.keys(colors).map((key) => {
      return message.channel.guild.createRole({
            name: key,
            permissions: 0,
            color: parseInt(colors[key], 16),
            mentionable: false
        }, "Automated colorme role creation via sixteen");
    }));

    let results = Promise.all(roles.map((role) => {
        return ctx.client.pg.query({
            text: "INSERT INTO roleme (id, guild, color) VALUES ($1, $2, $3);",
            values: [role.id, message.channel.guild.id, role.color.toString(16)]
        });
    }));

    return ctx.success(ctx.strings.get("colorme_sixteen"));
}

async function checks(member, ctx) {
    return member.permission.has("manageRoles");
}

module.exports = {
    name: "sixteen",
    category: "settings",
    checks,
    exec
};
