const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GUtil = require('./util.js');

module.exports = class JudgementCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'judgement',
            group: 'lolz',
            memberName: 'judgement',
            description: 'Judgement!',
            examples: ['judgement'],
            guildOnly: true,
            throttling: {
                usages: 3,
                duration: 1800
            }
        });
    }

    hasPermission(message) {
        return message.guild.id == '229042454165323776'; // TRG Land
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        const laughUrl = 'https://cdn.discordapp.com/attachments/229042454165323776/606584296148435020/judgement.gif';

        return message.say('', {embed: GUtil.picEmbed(laughUrl, message)})
            .then(() => {
                Util.updateLog('Judgement!' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('Judgement was trash!' + sourceInfo + '\n' + error, 'error');
            });
    }
};