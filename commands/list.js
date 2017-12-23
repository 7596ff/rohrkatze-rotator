const Jimp = require("jimp");

async function drawGrid(array) {
    let base = new Jimp(
        (5 % array.length == 5 ? 5 : array.length) * 100,
        Math.ceil(array.length / 5) * 100
    );

    for (let index in array) {
        let image = await Jimp.read(array[index]);
        await image.resize(100, 100);
        await base.composite(
            image,
            index % 5 * 100,
            Math.floor(index / 5) * 100
        );
    }

    return base;
}

async function exec(message, ctx) {
    let { error, folder, path } = await ctx.client.util.getFolder(ctx.client, message.channel.guild);
    
    if (error === "no_images") {
        return ctx.failure(ctx.strings.get("rotate_no_images"));
    }

    let results = [];

    while (folder.length) {
        let group = folder.splice(0, 25);
        let grid = await drawGrid(group.map((file) => `${path}/${file}`));
        let buffer = await grid.getBuffer(Jimp.MIME_PNG);

        let msg = [];
        while (group.length) {
            msg.push(group.splice(0, 5).join(" "));
        }

        results.push({
            text: msg.join("\n"),
            file: {
                name: "list.png",
                file: buffer
            }
        });
    }

    for (let result of results) {
        await ctx.code("js", result.text, result.file);
    }
}

module.exports = {
    name: "list",
    category: "rotate",
    typing: true,
    exec
};
