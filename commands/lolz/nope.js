const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GUtil = require('./util.js');

module.exports = class NopeCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'nope',
            group: 'lolz',
            memberName: 'nope',
            description: 'Nope!',
            examples: ['nope']
        });
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        return message.say('', {embed: GUtil.picEmbed('https://i.imgur.com/3CFcHZU.gif', message)})
            .then(() => {
                Util.updateLog('Nope!' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('Nope noped!' + sourceInfo + '\n' + error, 'error');
            });
    }
};