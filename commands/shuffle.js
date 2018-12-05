// https://stackoverflow.com/a/6274398
function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

async function exec(message, ctx) {
    let tokenized = ctx.tokenized.slice();
    tokenized = shuffle(tokenized);
    return ctx.send(tokenized.map((item, index) => `\`${index + 1}.\` ${item}`).join("\n"));
}

module.exports = {
    name: "shuffle",
    aliases: ["order"],
    category: "tools",
    exec
}

