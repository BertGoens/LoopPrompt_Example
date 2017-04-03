var builder = require('botbuilder');
var restify = require('restify');

var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {
    session.send('type \'beginLoop\' to begin adding key-value pairs');
    session.send('or type \'showResults\' to see all added key-value pairs');
    session.send('you may also type \'done\' to end the dialog early.')
}).beginDialogAction('beginLoopAction', 'Loop', {
    matches: /^beginloop$/i
}).beginDialogAction('beginShowResults', 'Results', {
    matches: /^showresults$/i
})

bot.dialog('Loop', [
    function (session, results) {
        session.userData.kVPairs = session.userData.kVPairs ? session.userData.kVPairs : [];
        builder.Prompts.text(session, 'Key to put?');
    },
    function (session, results) {
        session.dialogData.key = results.response;
        builder.Prompts.text(session, 'Value to put?');
    },
    function (session, results) {
        var value = results.response ? results.response : null,
            key = session.dialogData.key;
        var pairs = session.userData.kVPairs;
        var newPair = {};
        newPair[key] = value;
        if (key && value) {
            session.userData.kVPairs.push(newPair);
            console.log(pairs[pairs.length - 1]);
        }
        session.send('latest key-value pair added, { %s : %s }', key, value);
        session.replaceDialog('Loop');
    }
]).cancelAction('endLoop', 'Ending loop per request', {
    confirmPrompt: 'End loop?',
    matches: /^done$/i
})

bot.dialog('Results', [
    function (session, result) {
        let pairs = session.userData.kVPairs;
        session.send('Here are your key-value pairs.');

        for (var i = 0; i < pairs.length; i++) {
            for (var key in pairs[i]) {
                session.send('Pair %s: { %s: %s }', i + 1, key, pairs[i][key]);
            }
        }
        session.endDialog();
    }
]).cancelAction('endLoop', 'Ending loop per request', {
    confirmPrompt: 'End loop?',
    matches: /^done$/i
})