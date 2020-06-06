const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GConst = require('./const.js');

module.exports = class DelCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'del',
            group: 'mod',
            memberName: 'del',
            description: 'Individually deletes the last 1-99 messages',
            examples: ['del', 'del 10'],
            args: [
                {
					key: 'delNum',
					prompt: 'How many messages would you like to delete?',
					type: 'integer',
                    min: 1,
                    max: 99,
                    default: 1
				}
			]
        });
    }

    /* hasPermission(message) {
        return message.member.hasPermission('MANAGE_MESSAGES');
    } */

    hasPermission(message) {
        return this.client.isOwner(message.author);
    }

    async run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        const messages = await message.channel.fetchMessages({limit: args.delNum + 1})
            .catch(error => {
                Util.updateLog('Failed to fetch messages to delete!' + sourceInfo + '\n' + error, 'error');

                return message.reply('Failed to fetch messages for deletion! Please try again.')
                    .then(sentMessage => {
                        sentMessage.delete(GConst.tempMsgMs)
                            .catch(error => {
                                Util.updateLog('Failed to delete deletion confirmation!' + sourceInfo + '\n' + error,
                                    'error');
                            });
                    })
                    .catch(error => {
                        Util.updateLog('Failed to confirm deletion!' + sourceInfo + '\n' + error, 'error');
                    });
            });

        var msg_array = messages.array();

        // limit to the requested number + 1 for the command message
        var delActual = args.delNum + 1;

        if (messages.size < delActual){
            delActual = messages.size;
        }

        msg_array.length = delActual;
        
        var delCount = 0;
        var failCount = 0;

        for (let i = 0; i < msg_array.length; i++){
            await msg_array[i].delete().then(() => { delCount++; }).catch(() => { failCount++; });
        }

        Util.updateLog('Deleted ' + delCount + ' message' + Util.plu(delCount) +
            (failCount > 0 ? '. ' + failCount + ' failed!' : '') + sourceInfo);

        return message.reply('Deleted `' + delCount + '` message' + Util.plu(delCount) +
            (failCount > 0 ? '. ' + failCount + ' failed!' : '') + ' (Note: Includes the command message)')
            .then(sentMessage => {
                sentMessage.delete(GConst.tempMsgMs)
                    .catch(error => {
                        Util.updateLog('Failed to delete deletion confirmation!' + sourceInfo + '\n' + error,
                            'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to confirm deletion!' + sourceInfo + '\n' + error, 'error');
            });
    }
};