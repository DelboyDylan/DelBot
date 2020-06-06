const Commando = require('discord.js-commando');
const Mixer = require('beam-client-node');
const Util = require('../../util.js');
const Const = require('../../const.js');

module.exports = class GlobalStreamListCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'globalstreamlist',
            group: 'streams',
            memberName: 'globalstreamlist',
            description: 'Displays all the streams that are being announced by ' + Const.botName,
            examples: ['globalstreamlist']
        });
    }

    hasPermission(message) {
        return this.client.isOwner(message.author);
    }

    async run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        const mixer = new Mixer.Client(new Mixer.DefaultRequestRunner());

        const settings = this.client.provider;
        
        const mixerSubs = settings.get('global', 'mixersubs', []);

        if (mixerSubs.length == 0){
            return message.reply('There are no streams on the global ' + Const.botName + ' stream announcements list!')
                .catch(error => {
                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                });
        }

        var procMsg = await message.reply('Generating list, please standby ...')
            .catch(error => {
                Util.updateLog('Failed to send direct message!' + sourceInfo + '\n' + error, 'error');
            });

        var mixerNames = [];

        for (let i = 0; i < mixerSubs.length; i++){
            const res = await mixer.request('GET', 'channels/' + mixerSubs[i])
                .catch(error => {
                    Util.updateLog('Failed to retreive Mixer data!' + sourceInfo + '\n' + error, 'error');

                    return message.reply('failed to retreive Mixer data! Please try again.')
                        .catch(error => {
                            Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                        });
                });

            const mixerChannelData = res.body;
            
            if (!mixerChannelData.hasOwnProperty('error')){
                mixerNames.push(mixerChannelData.token);
            }
        }

        mixerNames.sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });

        var streamList = '```Markdown\n# Global ' + Const.botName + ' Stream Announcements List\n## Mixer\n';

        for (let i = 0; i < mixerNames.length; i++){
            streamList += '- ' + mixerNames[i] + '\n';
        }

        streamList += mixerNames.length + ' channel' + Util.plu(mixerNames.length) + ' found!';

        streamList += '```';

        procMsg.delete()
            .catch(error => {
                Util.updateLog('Failed to delete processing message!' + sourceInfo + '\n' + error, 'error');
            });

        return message.say(streamList)
            .catch(error => {
                Util.updateLog('Failed to send message!' + sourceInfo + '\n' + error, 'error');
            });
    }
};