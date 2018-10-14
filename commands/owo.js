const blank = "279251926409936896";
const yiff21 = "368359173618008064";

let grid = [
    "O",
    "O X X O X O X O X O X X O",
    "X O O X X O X O X X O O X",
    "X O O X X O X O X X O O X",
    "X O O X X O X O X X O O X",
    "O X X O X X X X X O X X O"
];

let owo = grid
    .join("\n")
    .replace(/O/g, `<:a:${blank}>`)
    .replace(/X/g, `<:a:${yiff21}>`);

async function exec(message, ctx) {
    return ctx.send(owo);
}

module.exports = {
    name: "owo",
    category: "fun",
    exec
};
