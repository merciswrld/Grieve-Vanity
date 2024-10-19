const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const fs = require('fs'); // Import fs to read files
const path = require('path'); // Import path for handling file paths
const db = require('./database'); 
require('dotenv').config(); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
    ]
});

// Load commands from the commands folder
const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

// Register commands with Discord
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
            body: commands,
        });
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
    if (newPresence?.status === 'online' && newPresence.activities.length > 0) {
        const activity = newPresence.activities[0];
        if (activity.type === 'CUSTOM_STATUS') {
            const member = newPresence.member;
            const guildId = member.guild.id;

            db.get(`SELECT custom_role_id FROM user_roles WHERE user_id = ? AND guild_id = ? AND custom_message = ?`,
                [member.id, guildId, activity.state], async (err, row) => {
                    if (err) {
                        console.error(err.message);
                        return;
                    }

                    if (row && row.custom_role_id) {
                        const roleToAssign = row.custom_role_id;

                        if (!member.roles.cache.has(roleToAssign)) {
                            try {
                                await member.roles.add(roleToAssign);
                                console.log(`Assigned role to ${member.user.tag}`);
                            } catch (error) {
                                console.error(`Failed to assign role: ${error}`);
                            }
                        }
                    } else {
                        console.log(`No custom role found for ${member.user.tag} with message: ${activity.state}`);
                    }
                });
        }
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isCommand()) {
        const command = commands.find(cmd => cmd.name === interaction.commandName);
        if (command) {
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply('There was an error while executing this command!');
            }
        }
    }
});

// Handle the prefixed command
client.on(Events.MessageCreate, async (message) => {
    if (message.content.startsWith(',setmessage')) {
        const args = message.content.split(' ').slice(1);
        const customMessage = args.slice(0, -1).join(' ');
        const roleMention = message.mentions.roles.first(); 
        const customRoleId = roleMention ? roleMention.id : null;
        const guildId = message.guild.id;

        if (!customRoleId) {
            return message.reply('You must mention a role to assign it with your vanity.');
        }

        db.run(`INSERT OR REPLACE INTO user_roles (user_id, guild_id, custom_message, custom_role_id) VALUES (?, ?, ?, ?)`, 
            [message.author.id, guildId, customMessage, customRoleId], function(err) {
            if (err) {
                console.error(err.message);
                message.reply('Failed to set your vanity or role.');
            } else {
                message.reply(`Your vanity has been set to: "${customMessage}" and your custom role has been set.`);
            }
        });
    }
});

client.login(process.env.DISCORD_TOKEN);

process.on('exit', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
    });
});
