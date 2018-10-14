async function exec(message, ctx) {
    return ctx.send(ctx.tokenized[Math.floor(Math.random() * ctx.tokenized.length)]);
}

module.exports = {
    name: "choose",
    category: "tools",
    exec
}

