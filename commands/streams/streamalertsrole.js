const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class StreamAlertsRoleCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'streamalertsrole',
            group: 'streams',
            memberName: 'streamalertsrole',
            description: 'Sets the stream alerts role',
            examples: ['streamalertsrole @role', 'streamalertsrole role'],
            guildOnly: true,
            args: [
				{
					key: 'role',
					prompt: 'Which role should be used for stream alerts?',
					type: 'role'
				}
			]
        });
    }

    hasPermission(message) {
        return message.member.hasPermission('MANAGE_GUILD') || this.client.isOwner(message.author);
    }

    run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        message.guild.settings.set('streamalertsrole', args.role.id)
            .then(newAlertsRoleId => {
                const roleName = message.guild.roles.get(newAlertsRoleId).name;

                Util.updateLog('Stream alerts role set to "' + roleName + '"' +
                    sourceInfo);

                return message.reply('stream alerts role set to `' + roleName + '`')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to save setting!' + sourceInfo + '\n' + error, 'error');
                
                return message.reply('failed to set stream alerts role! Please try again.')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            });
    }
};