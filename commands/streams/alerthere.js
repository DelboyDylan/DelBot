const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class AlertHereCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'alerthere',
            group: 'streams',
            memberName: 'alerthere',
            description: 'Toggles stream announcement alert mentions',
            examples: ['alerthere'],
            guildOnly: true
        });
    }

    hasPermission(message) {
        return message.member.hasPermission('MANAGE_GUILD') || this.client.isOwner(message.author);
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        const alertingHere = message.guild.settings.get('alerthere', false);

        const turnOn = !alertingHere;
        const onOff = (turnOn ? '`on`' : '`off`');

        message.guild.settings.set('alerthere', (turnOn ? true : false))
            .then(() => {
                Util.updateLog('@here stream alerts turned ' + onOff + sourceInfo);

                return message.reply('`@here` stream alerts have been turned ' + onOff)
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to save setting!' + sourceInfo + '\n' + error, 'error');

                return message.reply('failed to turn `@here` stream alerts ' + onOff + '! Please try again.')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, error);
                    });
            });
    }
};