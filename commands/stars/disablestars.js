const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class DisableStarsCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'disablestars',
            group: 'stars',
            memberName: 'disablestars',
            description: 'Disables stars in the server',
            examples: ['disablestars'],
            guildOnly: true
        });
    }

    hasPermission(message) {
        return message.member.hasPermission('MANAGE_GUILD') || this.client.isOwner(message.author);
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        message.guild.settings.remove('starchannel')
            .then(() => {
                Util.updateLog('Stars disabled' + sourceInfo);

                return message.reply('stars disabled')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to remove setting!' + sourceInfo + '\n' + error, 'error');

                return message.reply('failed to disable stars! Please try again.')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            });
    }
};