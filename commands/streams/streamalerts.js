const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class StreamAlertsCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'streamalerts',
            aliases: ['nostreams', 'contentalerts'],
            group: 'streams',
            memberName: 'streamalerts',
            description: 'Toggles stream alerts for the user',
            examples: ['streamalerts'],
            guildOnly: true
        });
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        const streamAlertsRoleId = message.guild.settings.get('streamalertsrole', '0');

        if (message.guild.roles.has(streamAlertsRoleId)){
            const streamAlertsRole = message.guild.roles.get(streamAlertsRoleId);

            if (!message.member.roles.has(streamAlertsRoleId)){
                message.member.addRole(streamAlertsRole)
                    .then(() => {
                        Util.updateLog('Stream alerts role given to user' + sourceInfo);

                        return message.reply('you have now been given the `' + streamAlertsRole.name + '` role')
                            .catch(error => {
                                Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error,
                                    'error');
                            });
                    })
                    .catch(error => {
                        Util.updateLog('Failed to give stream alerts role to user!' + sourceInfo + '\n' + error, 'error');

                        return message.reply('something went wrong!')
                            .catch(error => {
                                Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error,
                                    'error');
                            });
                    });
            } else {
                message.member.removeRole(streamAlertsRole)
                    .then(() => {
                        Util.updateLog('Stream alerts role revoked from user' + sourceInfo);

                        return message.reply('you have now been removed from the `' + streamAlertsRole.name + '` role')
                            .catch(error => {
                                Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error,
                                    'error');
                            });
                    })
                    .catch(error => {
                        Util.updateLog('Failed to revoke stream alerts role from user!' + sourceInfo + '\n' + error, 'error');

                        return message.reply('something went wrong!')
                            .catch(error => {
                                Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error,
                                    'error');
                            });
                    });
            }
        } else {
            if (streamAlertsRoleId != '0'){
                message.guild.settings.remove('streamalertsrole')
                    .then(() => {
                        Util.updateLog('Removed invalid stream alerts role setting' + sourceInfo, 'warn');
                    });
            }

            return message.reply('stream alerts role not set!')
                .catch(error => {
                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                });
        }
    }
};