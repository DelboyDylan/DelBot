const Commando = require('discord.js-commando');
const Mixer = require('beam-client-node');
const Util = require('../../util.js');

module.exports = class StreamListCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'streamlist',
            group: 'streams',
            memberName: 'streamlist',
            description: 'Displays the streams that are being announced',
            examples: ['streamlist'],
            guildOnly: true
        });
    }

    async run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        const mixer = new Mixer.Client(new Mixer.DefaultRequestRunner());
        
        const mixerSubs = message.guild.settings.get('mixersubs', []);

        if (mixerSubs.length == 0){
            return message.reply('There are no streams on the stream announcements list!')
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

        var streamList = '```Markdown\n# ' + message.guild.name + ' Stream Announcements List\n## Mixer\n';

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