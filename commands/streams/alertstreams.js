const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class AlertStreamsCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'alertstreams',
            group: 'streams',
            memberName: 'alertstreams',
            description: 'Toggles stream announcement alert mentions',
            examples: ['alertstreams'],
            guildOnly: true
        });
    }

    hasPermission(message) {
        return message.member.hasPermission('MANAGE_GUILD') || this.client.isOwner(message.author);
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        const alertingStreams = message.guild.settings.get('alertstreams', false);

        const turnOn = !alertingStreams;
        const onOff = (turnOn ? '`on`' : '`off`');

        message.guild.settings.set('alertstreams', (turnOn ? true : false))
            .then(() => {
                Util.updateLog('Stream announcement alerts turned ' + onOff + sourceInfo);

                return message.reply('stream announcement alerts have been turned ' + onOff)
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to save setting!' + sourceInfo + '\n' + error, 'error');

                return message.reply('failed to turn stream announcement alerts ' + onOff + '! Please try again.')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, error);
                    });
            });
    }
};