//TODO: удалить модуль в 2023г
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const SQL = require('sql-template-strings');

class SqliteConnectionPool {
    constructor() {
        this.closed = true;
    }

    async open(poolConfig, dbFileName) {
        const connCount = poolConfig.connCount || 1;
        const busyTimeout = poolConfig.busyTimeout || 60*1000;
        const cacheSize = poolConfig.cacheSize || 2000;

        this.dbFileName = dbFileName;
        this.connections = [];
        this.freed = new Set();
        this.waitingQueue = [];

        for (let i = 0; i < connCount; i++) {
            let client = await sqlite.open({
                filename: dbFileName,
                driver: sqlite3.Database
            });

            client.configure('busyTimeout', busyTimeout); //ms
            await client.exec(`PRAGMA cache_size = ${cacheSize}`);

            client.ret = () => {
                this.freed.add(i);
                if (this.waitingQueue.length) {
                    this.waitingQueue.shift().onFreed(i);
                }
            };

            this.freed.add(i);
            this.connections[i] = client;
        }
        this.closed = false;
    }

    get() {
        return new Promise((resolve) => {
            if (this.closed)
                throw new Error('Connection pool closed');

            const freeConnIndex = this.freed.values().next().value;
            if (freeConnIndex !== undefined) {
                this.freed.delete(freeConnIndex);
                resolve(this.connections[freeConnIndex]);
                return;
            }

            this.waitingQueue.push({
                onFreed: (connIndex) => {
                    this.freed.delete(connIndex);
                    resolve(this.connections[connIndex]);
                },
            });
        });
    }

    async run(query) {
        const dbh = await this.get();
        try {
            let result = await dbh.run(query);
            dbh.ret();
            return result;
        } catch (e) {
            dbh.ret();
            throw e;
        }
    }

    async all(query) {
        const dbh = await this.get();
        try {
            let result = await dbh.all(query);
            dbh.ret();
            return result;
        } catch (e) {
            dbh.ret();
            throw e;
        }
    }

    async exec(query) {
        const dbh = await this.get();
        try {
            let result = await dbh.exec(query);
            dbh.ret();
            return result;
        } catch (e) {
            dbh.ret();
            throw e;
        }
    }

    async close() {
        for (let i = 0; i < this.connections.length; i++) {
            await this.connections[i].close();
        }
        this.closed = true;
    }

     // Modified from node-sqlite/.../src/Database.js
    async migrate(migs, table, force) {
        const migrations = migs.sort((a, b) => Math.sign(a.id - b.id));

        if (!migrations.length) {
            throw new Error('No migration data');
        }

        migrations.map(migration => {
            const data = migration.data;
            const [up, down] = data.split(/^--\s+?down\b/mi);
            if (!down) {
                const message = `The ${migration.filename} file does not contain '-- Down' separator.`;
                throw new Error(message);
            } else {
                /* eslint-disable no-param-reassign */
                migration.up = up.replace(/^-- .*?$/gm, '').trim();// Remove comments
                migration.down = down.trim(); // and trim whitespaces
            }
        });

        // Create a database table for migrations meta data if it doesn't exist
        await this.run(`CREATE TABLE IF NOT EXISTS "${table}" (
    id   INTEGER PRIMARY KEY,
    name TEXT    NOT NULL,
    up   TEXT    NOT NULL,
    down TEXT    NOT NULL
)`);

        // Get the list of already applied migrations
        let dbMigrations = await this.all(
            `SELECT id, name, up, down FROM "${table}" ORDER BY id ASC`,
        );

        // Undo migrations that exist only in the database but not in migs,
        // also undo the last migration if the `force` option was set to `last`.
        const lastMigration = migrations[migrations.length - 1];
        for (const migration of dbMigrations.slice().sort((a, b) => Math.sign(b.id - a.id))) {
            if (!migrations.some(x => x.id === migration.id) ||
                (force === 'last' && migration.id === lastMigration.id)) {
                const dbh = await this.get();
                await dbh.run('BEGIN');
                try {
                    await dbh.exec(migration.down);
                    await dbh.run(SQL`DELETE FROM "`.append(table).append(SQL`" WHERE id = ${migration.id}`));
                    await dbh.run('COMMIT');
                    dbMigrations = dbMigrations.filter(x => x.id !== migration.id);
                } catch (err) {
                    await dbh.run('ROLLBACK');
                    throw err;
                } finally {
                    dbh.ret();
                }
            } else {
                break;
            }
        }

        // Apply pending migrations
        let applied = [];
        const lastMigrationId = dbMigrations.length ? dbMigrations[dbMigrations.length - 1].id : 0;
        for (const migration of migrations) {
            if (migration.id > lastMigrationId) {
                const dbh = await this.get();
                await dbh.run('BEGIN');
                try {
                    await dbh.exec(migration.up);
                    await dbh.run(SQL`INSERT INTO "`.append(table).append(
                        SQL`" (id, name, up, down) VALUES (${migration.id}, ${migration.name}, ${migration.up}, ${migration.down})`)
                    );
                    await dbh.run('COMMIT');
                    applied.push(migration.id);
                } catch (err) {
                    await dbh.run('ROLLBACK');
                    throw err;
                } finally {
                    dbh.ret();
                }
            }
        }

        return applied;
    }
}

module.exports = SqliteConnectionPool;