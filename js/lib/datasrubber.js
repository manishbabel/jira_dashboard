var verbs, nouns, adjectives, adverbs, preposition;
nouns = ["bird", "clock", "boy", "plastic", "duck", "teacher", "old lady", "professor", "hamster", "dog"];
verbs = ["kicked", "ran", "flew", "dodged", "sliced", "rolled", "died", "breathed", "slept", "killed"];
adjectives = ["beautiful", "lazy", "professional", "lovely", "dumb", "rough", "soft", "hot", "vibrating", "slimy"];
adverbs = ["slowly", "elegantly", "precisely", "quickly", "sadly", "humbly", "proudly", "shockingly", "calmly", "passionately"];
preposition = ["down", "into", "up", "on", "upon", "below", "above", "through", "across", "towards"];
function randGen() {
    return Math.floor(Math.random() * 5);
}
function sentence() {
    var rand1 = Math.floor(Math.random() * 10);
    var rand2 = Math.floor(Math.random() * 10);
    var rand3 = Math.floor(Math.random() * 10);
    var rand4 = Math.floor(Math.random() * 10);
    var rand5 = Math.floor(Math.random() * 10);
    var rand6 = Math.floor(Math.random() * 10);
    //                var randCol = [rand1,rand2,rand3,rand4,rand5];
    //                var i = randGen();
    var content = "The " + adjectives[rand1] + " " + nouns[rand2] + " " + adverbs[rand3] + " " + verbs[rand4] + " because some " + nouns[rand1] + " " + adverbs[rand1] + " " + verbs[rand1] + " " + preposition[rand1] + " a " + adjectives[rand2] + " " + nouns[rand5] + " which, became a " + adjectives[rand3] + ", " + adjectives[rand4] + " " + nouns[rand6] + ".";
    return content
};

function shortSentence() {
    var rand0 = Math.floor(Math.random() * 10);
    var rand1 = Math.floor(Math.random() * 10);
    var rand2 = Math.floor(Math.random() * 10);
    var rand3 = Math.floor(Math.random() * 10);
    return adverbs[rand0] + " " + verbs[rand1] + " " + adjectives[rand2] + " " + nouns[rand3];

}

queue()
    .defer(d3.json, "data/CFX-data.json")
    .await(readyToScrub);

function readyToScrub(error, jiraData) {
    jiraData.issues.forEach(function (issue) {
       issue.fields.summary =  shortSentence();
       issue.fields.description =  sentence();
       issue.fields.comment.comments.forEach(function (comment) {
           comment.body = sentence();
       })

    });

    var txtFile = "CFX-data-scrubbed.json";
    var file = new File([""], txtFile);
    var str = JSON.stringify(jiraData);
    console.log(str);
}