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

    let grid = await drawGrid(folder.map((file) => `${path}/${file}`));
    let msg = [];

    while (folder.length) {
        msg.push(folder.splice(0, 5).join(" "));
    }

    grid.getBuffer(grid.getMIME(), (err, buffer) => {
        return ctx.code("js", msg.join("\n"), {
            name: "list.png",
            file: buffer
        });
    });
}

module.exports = {
    name: "list",
    category: "rotate",
    typing: true,
    exec
};
