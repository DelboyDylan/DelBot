const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class DeleteOfflineCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'deleteoffline',
            group: 'streams',
            memberName: 'deleteoffline',
            description: 'Toggles whether offline stream announcements are deleted after 30 mins',
            examples: ['deleteoffline'],
            guildOnly: true
        });
    }

    hasPermission(message) {
        return message.member.hasPermission('MANAGE_GUILD') || this.client.isOwner(message.author);
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        const deletingOffline = message.guild.settings.get('deleteoffline', false);

        const turnOn = !deletingOffline;
        const onOff = (turnOn ? '`on`' : '`off`');

        message.guild.settings.set('deleteoffline', (turnOn ? true : false))
            .then(() => {
                Util.updateLog('Deletion of offline stream announcements turned ' + onOff + sourceInfo);

                return message.reply('deletion of offline stream announcements has been turned ' + onOff)
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to save setting!' + sourceInfo + '\n' + error, 'error');
                
                return message.reply('failed to turn offline stream announcement deletions ' + onOff +
                    '! Please try again.')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            });
    }
};