const config = require("../config.json");
const Postgres = require("pg");
const pg = new Postgres.Client(config.postgres);

let starboardQuery = [
    "CREATE TABLE starboard (",
    "date BIGINT,",
    "guild BIGINT,",
    "member BIGINT,",
    "channel BIGINT,",
    "message BIGINT,",
    "post BIGINT,",
    "stars INT,",
    "PRIMARY KEY (message));"
];

let whoQuery = [
    "CREATE TABLE who (",
    "message BIGINT,",
    "member BIGINT,",
    "UNIQUE (message, member)",
    ");"
]

pg.connect().then(async () => {
    try {
        await pg.query("ALTER TABLE guilds RENAME TO guilds2;");
        console.log("renamed guilds table, run casca_migrate.js");
        process.exit(0);
    } catch (error) {
        if (error.code === "42P01") {
            console.log("guilds table already renamed");
            process.exit(0);
        } else if (error.code === "42P07") {
            console.log("guilds and guilds2 exist, beginning migrations");
        } else {
            console.error(error);
            process.exit(1);
        }
    }

    let guilds2 = await pg.query("SELECT * FROM guilds2;");
    for (let row of guilds2.rows) {
        await pg.query({
            text: "INSERT INTO guilds (id, activity, timeout, meme, dont, slowrole, pinboardin, pinboardout, cleanpins, rolestate, starboard, current, lasttime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);",
            values: [row.id, row.activityrole, row.timeout, row.meme, row.dont, row.slowrole, row.pinboardin, row.pinboardout, row.cleanpins, row.rolestate, row.starboard, row.current, row.lasttime]
        });
    }

    console.log(`migrated guilds, ${guilds2.rows.length} rows`);

    let starboard = await pg.query("SELECT * FROM starboard");
    await pg.query("ALTER TABLE starboard RENAME TO starboard2;");
    await pg.query(starboardQuery.join(" "));
    await pg.query(whoQuery.join(" "));
    for (let row of starboard.rows) {
        await pg.query({
            text: "INSERT INTO starboard (date, guild, member, channel, message, post, stars) VALUES ($1, $2, $3, $4, $5, $6, $7);",
            values: [row.date, row.guild, row.member, row.channel, row.msg, row.post, row.stars]
        });

        for (let who of row.who.who) {
            await pg.query({
                text: "INSERT INTO who (message, member) VALUES ($1, $2);",
                values: [row.msg, who]
            });
        }

        console.log(`added ${row.who.who.length} rows to who for ${row.msg}`);
    }

    console.log(`migrated starboard, ${starboard.rows.length} rows`);

    process.exit(0);
});
