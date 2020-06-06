const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class TFCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'tf',
            group: 'lolz',
            memberName: 'tf',
            description: 'Table flip!',
            examples: ['tf']
        });
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        return message.say('(╯°□°）╯︵ ┻━┻')
            .then(() => {
                Util.updateLog('Table flipped!' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('Table refused to flip!' + sourceInfo + '\n' + error, 'error');
            });
    }
};