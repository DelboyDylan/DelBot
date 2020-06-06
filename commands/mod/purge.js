const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GConst = require('./const.js');

module.exports = class PurgeCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'purge',
            group: 'mod',
            memberName: 'purge',
            description: 'Purges a channel of up to 100 messages, that have been posted within the last 2 weeks',
            examples: ['purge #channel', 'purge channel 50'],
            guildOnly: true,
            args: [
				{
					key: 'channel',
					prompt: 'Which channel do you wish to purge?',
					type: 'channel'
				},
                {
					key: 'purgeNum',
					prompt: 'How many messages would you like to purge?',
					type: 'integer',
                    min: 1,
                    max: 1000,
                    default: 1000
				}
			]
        });
    }

    /* hasPermission(message) {
        return message.member.hasPermission('ADMINISTRATOR');
    } */

    hasPermission(message) {
        return this.client.isOwner(message.author);
    }

    async run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        const purgeChannel = args.channel;
        var purgeNum = args.purgeNum;

        if (message.channel.id == purgeChannel.id){
            purgeNum++;
        } else {
            message.delete(GConst.tempMsgMs)
                .catch(error => {
                    Util.updateLog('Failed to delete command!' + sourceInfo + '\n' + error, 'error');
                });
        }

        var messagesPurged = 0;
        var lastMessage = null;

        do {
            const loopPurge = (purgeNum < 100 ? purgeNum : 100);
            const fetchOptions = '{"limit":' + loopPurge + (lastMessage == null ? '}' : ',"before":"' + lastMessage + '"}');

            const purgeMessages = await purgeChannel.fetchMessages(JSON.parse(fetchOptions))
                .catch(error => {
                    Util.updateLog('Failed to fetch messages to purge!' + sourceInfo + '\n' + error, 'error');

                    message.reply('Failed to fetch messages to purge! Please try again.')
                        .catch(error => {
                            Util.updateLog('Failed to confirm purge!' + sourceInfo + '\n' + error, 'error');
                        });
                });

            if (typeof purgeMessages != 'undefined'){
                if (purgeMessages.size < 100 && purgeNum >= 100){
                    purgeNum = purgeMessages.size;
                }

                if (purgeMessages.size == 1){
                    await purgeMessages.array()[0].delete()
                        .then(() => {
                            messagesPurged++;
                            purgeNum--;
                        })
                        .catch(error => {
                            Util.updateLog('Failed to delete message!' + sourceInfo + '\n' + error, 'error');
                        });
                } else if (purgeMessages.size > 1) {
                    const purgedMessages = await purgeChannel.bulkDelete(purgeMessages, true)
                        .catch(error => {
                            Util.updateLog('Failed to purge messages!' + sourceInfo + '\n' + error, 'error');
        
                            message.reply('Failed to purge messages! Please try again.')
                                .catch(error => {
                                    Util.updateLog('Failed to confirm purge!' + sourceInfo + '\n' + error,
                                        'error');
                                });
                        });

                    if (typeof purgedMessages != 'undefined'){
                        messagesPurged += purgedMessages.size;
                        purgeNum -= loopPurge;

                        lastMessage = purgedMessages.lastKey();
                    } else {
                        purgeNum = 0;
                    }
                }
            } else {
                purgeNum = 0;
            }
        }
        while (purgeNum > 0);

        Util.updateLog('Purged #' + purgeChannel.name + ' of ' + messagesPurged + ' message' + Util.plu(messagesPurged) +
            sourceInfo);

        return message.reply('Purged **' + purgeChannel.name + '** of `' + messagesPurged + '` message' +
            Util.plu(messagesPurged) + '!' +
            (message.channel.id == purgeChannel.id ? ' (Note: Includes the command message)' : ''))
            .then(sentMessage => {
                sentMessage.delete(GConst.tempMsgMs)
                    .catch(error => {
                        Util.updateLog('Failed to delete purge confirmation!' + sourceInfo + '\n' + error, 'error');
                    });
            })
            .catch(error => {
                Util.updateLog('Failed to confirm purge!' + sourceInfo + '\n' + error, 'error');
            });
    }
};