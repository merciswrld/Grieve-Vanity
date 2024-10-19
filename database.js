const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id TEXT,
            guild_id TEXT,
            custom_message TEXT,
            custom_role_id TEXT,
            PRIMARY KEY (user_id, guild_id) -- Use both user_id and guild_id as the primary key
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table: ' + err.message);
        } else {
            console.log('user_roles table is ready.');
        }
    });
});

function getUserRole(userId, guildId, callback) {
    db.get(`SELECT custom_message, custom_role_id FROM user_roles WHERE user_id = ? AND guild_id = ?`, [userId, guildId], callback);
}

function setUserRole(userId, guildId, customMessage, customRoleId, callback) {
    db.run(`INSERT OR REPLACE INTO user_roles (user_id, guild_id, custom_message, custom_role_id) VALUES (?, ?, ?, ?)`, 
        [userId, guildId, customMessage, customRoleId], callback);
}

function closeDatabase() {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
    });
}

module.exports = {
    db,
    getUserRole,
    setUserRole,
    closeDatabase,
};
