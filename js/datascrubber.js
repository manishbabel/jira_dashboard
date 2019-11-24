let fs = require("fs");

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


var jiraData = JSON.parse(fs.readFileSync("CFX-data.json"));

	jiraData.issues.forEach(function (issue) {
       issue.fields.summary =  shortSentence();
       issue.fields.description =  sentence();
       issue.fields.comment.comments.forEach(function (comment) {
           comment.body = sentence();
       })
	   issue.fields.customfield_13802 = sentence();
	   
	   //spice up the data
	   if(issue.key == "CFX-1973" ) issue.fields.customfield_10003 = 5;
	   if(issue.key == "CFX-1983" ) issue.fields.customfield_10003 = 3;
	   if(issue.key == "CFX-1986" ) issue.fields.customfield_10003 = 3;

	   

    });

    var str = JSON.stringify(jiraData);
    console.log(str);

