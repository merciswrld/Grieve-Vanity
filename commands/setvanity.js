const { SlashCommandBuilder } = require('discord.js');
const db = require('../database'); // Adjust the path based on your file structure

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setvanity')
        .setDescription('Set your custom vanity.')
        .addStringOption(option =>
            option.setName('Set your server vanity')
                .setDescription('Your vanity')
                .setRequired(true)),
    async execute(interaction) {
        const customMessage = interaction.options.getString('message');
        const guildId = interaction.guild.id;

        db.run(`INSERT OR REPLACE INTO user_roles (user_id, guild_id, custom_message, custom_role_id) VALUES (?, ?, ?, ?)`,
            [interaction.user.id, guildId, customMessage, null], function (err) {
                if (err) {
                    console.error(err.message);
                    return interaction.reply('Failed to set your vanity message.');
                }
                return interaction.reply(`Your vanity message has been set to: "${customMessage}".`);
            });
    },
};
