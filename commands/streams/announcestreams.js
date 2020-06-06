const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class AnnounceStreamsCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'announcestreams',
            group: 'streams',
            memberName: 'announcestreams',
            description: 'Toggles stream announcements',
            examples: ['announcestreams'],
            guildOnly: true
        });
    }

    hasPermission(message) {
        return message.member.hasPermission('MANAGE_GUILD') || this.client.isOwner(message.author);
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        const announcingStreams = message.guild.settings.get('announcestreams', false);

        const turnOn = !announcingStreams;
        const onOff = (turnOn ? '`on`' : '`off`');

        message.guild.settings.set('announcestreams', (turnOn ? true : false))
            .then(() => {
                Util.updateLog('Stream announcements turned ' + onOff + sourceInfo);

                return message.reply('stream announcements have been turned ' + onOff)
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to save setting!' + sourceInfo + '\n' + error, 'error');

                return message.reply('failed to turn stream announcements ' + onOff + '! Please try again.')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            });
    }
};