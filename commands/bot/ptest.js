const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class PTestCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'ptest',
            group: 'bot',
            memberName: 'ptest',
            description: 'Posts one or more test messages',
            examples: ['ptest', 'ptest 10', 'ptest 10 "Stuff and things!"'],
            args: [
                {
					key: 'postNum',
					prompt: 'How many test messages would you like to post?',
					type: 'integer',
                    min: 1,
                    max: 1500,
                    default: 1
                },
                {
					key: 'testMsg',
					prompt: 'What should the test message(s) say?',
					type: 'string',
                    default: 'This is a test message!'
                }
			]
        });
    }

    hasPermission(message) {
        return this.client.isOwner(message.author);
    }

    async run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        var msgsSent = 0;

        for (let i = 0; i < args.postNum; i++){
            await message.say(args.testMsg)
                .then(() => {
                    msgsSent++;
                })
                .catch(error => {
                    Util.updateLog('Failed to send test message!' + sourceInfo + '\n' + error, 'error');
                });
        }

        Util.updateLog('Sent ' + msgsSent + ' test message' + Util.plu(msgsSent) + sourceInfo);
    }
};