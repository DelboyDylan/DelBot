const Commando = require('discord.js-commando');
const Util = require('../../util.js');

module.exports = class AnnotateStarCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'annotatestar',
            group: 'stars',
            memberName: 'annotatestar',
            description: 'Adds an annotation to a starred message',
            examples: ['annotatestar 367717156881956865 "Annotation message"'],
            guildOnly: true,
            args: [
				{
					key: 'starMsgId',
					prompt: 'What is the message ID of the star post you wish to annotate?',
					type: 'string'
                },
                {
					key: 'annotation',
					prompt: 'What is the annotation you wish to add?',
					type: 'string',
                    default: ''
				}
			]
        });
    }

    hasPermission(message) {
        return message.member.hasPermission('MANAGE_MESSAGES');
    }

    async run(message, args) {
        const sourceInfo = Util.commandInfo(message);

        const theGuild = message.guild;

        const starChannelId = theGuild.settings.get('starchannel', '0');
        
        if (!theGuild.channels.has(starChannelId)) {
            return message.reply('Star channel not set!')
                .catch(error => {
                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                });
        }
    
        const starChannel = theGuild.channels.get(starChannelId);
        const starsFilename = 'stars\\' + theGuild.id;
        var guildStars = [];
    
        if (Util.checkJSON(starsFilename)){
            guildStars = Util.loadJSON(starsFilename);
        }
    
        for (let i = 0; i < guildStars.length; i++){
            if (guildStars[i].quoteMsgId == args.starMsgId){
                const starMessage = await starChannel.fetchMessage(guildStars[i].quoteMsgId)
                    .catch(error => {
                        Util.updateLog('Failed to fetch star message!' + sourceInfo + '\n' + error, 'error');
                    });
    
                if (typeof starMessage != 'undefined'){
                    return starMessage.edit(args.annotation)
                        .then(() => {
                            Util.updateLog('Star message annotated' + sourceInfo);

                            message.reply('Added annotation.')
                                .catch(error => {
                                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                                });
                        })
                        .catch(error => {
                            Util.updateLog('Annotation failed!' + sourceInfo + '\n' + error, 'error');

                            message.reply('Failed to add annotation! Please try again.')
                                .catch(error => {
                                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                                });
                        });
                }
            }
        }

        return message.reply('Unable to find star message!')
            .catch(error => {
                Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
            });
    }
};