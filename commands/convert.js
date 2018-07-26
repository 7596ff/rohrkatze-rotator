const snekfetch = require("snekfetch");
const money = require("money");
const convert = require("convert-units");

async function exec(message, ctx) {
    if (money.base === "") {
        let response = await snekfetch.get(`https://openexchangerates.org/api/latest.json?app_id=${ctx.client.options.openexchangerates}`);
        let data = response.body;
        
        if (data && data.rates && data.base) {
            money.rates = data.rates;
            money.base = data.base;
        } else {
            return ctx.failure(ctx.strings.get("bot_generic_error"));
        }
    }

    const quantity = parseInt(ctx.options[0].replace(/D+/g, ""));
    const inLocation = ctx.options.indexOf(ctx.options.find((item) => ["in", "to", "of"].includes(item)));

    // if we can't find a in or as, return
    if (!inLocation) {
        return ctx.send(ctx.strings.get("bot_bad_syntax"));
    }

    const fromUnit = ctx.options.slice(1, inLocation).join(" ");
    const toUnit = ctx.options.slice(inLocation + 1).join(" ");

    // try standard units first
    try {
        let result = convert(quantity).from(fromUnit).to(toUnit);
        return ctx.send(ctx.strings.get("convert_response", quantity, fromUnit, result, toUnit));
    } catch (err) {
        // pass
    }

    // now try currency
    try {
        let result = money.convert(quantity, {from: fromUnit.toUpperCase(), to: toUnit.toUpperCase()});
        return ctx.send(ctx.strings.get("convert_response", quantity, fromUnit, result, toUnit));
    } catch (err) {
        console.error(err);
        // pass
    }

    await ctx.error("bot_bad_input_abbr");
}

module.exports = {
    name: "convert",
    category: "tools",
    exec
}