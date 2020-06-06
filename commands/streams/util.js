const Mixer = require('beam-client-node');
const Util = require('../../util.js');

const mixer = new Mixer.Client(new Mixer.DefaultRequestRunner());

exports.getMixerChannelData = async function(mixerChannelName, message, sourceInfo){
    const channelRes = await mixer.request('GET', 'channels/' + mixerChannelName)
        .catch(error => {
            Util.updateLog('Failed to retreive Mixer data!' + sourceInfo + '\n' + error, 'error');

            message.reply('failed to retreive Mixer data! Please try again.')
                .catch(error => {
                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                });
        });

    if (typeof channelRes == 'undefined') return null;

    const mixerChannelData = channelRes.body;

    if (mixerChannelData.hasOwnProperty('error')){
        Util.updateLog(mixerChannelName + ': ' + mixerChannelData.message + sourceInfo, 'warn');

        message.reply('Mixer channel `' + mixerChannelName + '` does not appear to exist!')
            .catch(error => {
                Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
            });

        return null;
    }

    return mixerChannelData;
};

exports.mixerChannelUserList = async function(mixerChannelId, userGroup, message, sourceInfo){
    const userGroupData = await mixer.request('GET', 'channels/' + mixerChannelId + '/users/' + userGroup, {qs: { page: 0 }})
        .catch(error => {
            Util.updateLog('Failed to retreive Mixer data!' + sourceInfo + '\n' + error, 'error');

            message.reply('failed to retreive Mixer data! Please try again.')
                .catch(error => {
                    Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                });
        });

    if (typeof userGroupData == 'undefined') return null;
    
    const totalGroupUsers = parseInt(userGroupData.headers['x-total-count']);

    var userGroupMembers = userGroupData.body;

    const numAdditionalPages = Math.ceil((totalGroupUsers - 50) / 50);

    for (let i = 0; i < numAdditionalPages; i++){
        const userGroupPageData = await mixer.request('GET', 'channels/' + mixerChannelId + '/users/' + userGroup,
            {qs: { page: i + 1, noCount: true }})
            .catch(error => {
                Util.updateLog('Failed to retreive Mixer data!' + sourceInfo + '\n' + error, 'error');

                message.reply('failed to retreive Mixer data! Please try again.')
                    .catch(error => {
                        Util.updateLog('Failed to reply to user!' + sourceInfo + '\n' + error, 'error');
                    });
            });

        if (typeof userGroupPageData == 'undefined') return null;

        userGroupMembers.push.apply(userGroupMembers, userGroupPageData.body);
    }

    var userGroupNames = [];
    
    for (let i = 0; i < userGroupMembers.length; i++){
        userGroupNames.push(userGroupMembers[i].username);
    }

    return userGroupNames.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
};