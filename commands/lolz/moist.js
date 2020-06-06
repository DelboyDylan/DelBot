const Commando = require('discord.js-commando');
const Util = require('../../util.js');
const GUtil = require('./util.js');

module.exports = class MoistCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'moist',
            group: 'lolz',
            memberName: 'moist',
            description: 'How moist are you?',
            examples: ['moist'],
            guildOnly: true
        });
    }

    hasPermission(message) {
        return message.guild.id == '229042454165323776'; // TRG Land
    }

    run(message) {
        const sourceInfo = Util.commandInfo(message);

        var moistness = Util.randomNumber(0, 100);

        if (message.author.id == '275725273016827904'){ // grimmers#9337
            moistness = Util.randomNumber(100, 200);
        }

        var moist = '*' + message.member.displayName + ' is currently ' + moistness + '% moist!';
        var moistPicEmbed = {};

        if (moistness == 0){
            moist += ' They are the desert!';
            moistPicEmbed = {embed: GUtil.picEmbed('https://media.giphy.com/media/1wwv6MnSsQwP6/giphy.gif', message)};
        } else if (moistness <= 10){
            moist += ' They are drying out!';
        } else if (moistness == 100){
            moist += ' Oh no, they are drowning!';

            moistPicEmbed = {
                embed: GUtil.picEmbed('https://i.pinimg.com/originals/b5/13/08/b51308fdcb0ac02fc00cb934b815d263.gif', message)
            };
        } else if (moistness > 100){
            moist += ' 💦 They moisten us all!';

            moistPicEmbed = {
                embed: GUtil.picEmbed('https://i.dailymail.co.uk/i/pix/2015/06/13/02/2993C56600000578-3121822-image-m-3_1434158803049.jpg', message)
            };
        } else if (moistness >= 90){
            moist += ' 💦 Someone grab a mop!';
        } else if (moistness == 69){
            moist += ' Nice 😏';
        }

        moist += '*';

        return message.say(moist, moistPicEmbed)
            .then(() => {
                Util.updateLog('Moist!' + sourceInfo);
            })
            .catch(error => {
                Util.updateLog('Dry!' + sourceInfo + '\n' + error, 'error');
            });
    }
};