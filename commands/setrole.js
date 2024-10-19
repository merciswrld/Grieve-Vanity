const { SlashCommandBuilder } = require('discord.js');
const db = require('../database'); // Adjust the path based on your file structure

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setrole')
        .setDescription('Set the role to assign.')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to assign')
                .setRequired(true)),
    async execute(interaction) {
        const customRoleId = interaction.options.getRole('role')?.id;
        const guildId = interaction.guild.id;

        db.run(`INSERT OR REPLACE INTO user_roles (user_id, guild_id, custom_message, custom_role_id) VALUES (?, ?, ?, ?)`,
            [interaction.user.id, guildId, null, customRoleId], function (err) {
                if (err) {
                    console.error(err.message);
                    return interaction.reply('Failed to set your role.');
                }
                return interaction.reply(`Your role has been set to: <@&${customRoleId}>.`);
            });
    },
};
