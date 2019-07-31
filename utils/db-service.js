const pg = require('pg');

async function runSql(sql) {
    return new Promise((resolve, reject) => {
        var client = new pg.Client(process.env.pgurl);
        client.connect(function (err) {
            if (err) {
                reject(err);
            }
            client.query(sql, async function (err, result) {
                if (err) {
                    reject(err);
                }
                await client.end();
                if (result) {
                    resolve(result.rows);
                } else {
                    reject('Something went wrong');
                }
            });
        });
    });
}

module.exports = {
    runSql
};