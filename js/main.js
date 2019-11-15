//https://startbootstrap.com/themes/sb-admin-2/
// var json = {"countries_msg_vol": {
//         "CA": 170, "US": 393, "BB": 12, "CU": 9, "BR": 89, "MX": 192, "PY": 32, "UY": 9, "VE": 25, "BG": 42, "CZ": 12, "HU": 7, "RU": 184, "FI": 42, "GB": 162, "IT": 87, "ES": 65, "FR": 42, "DE": 102, "NL": 12, "CN": 92, "JP": 65, "KR": 87, "TW": 9, "IN": 98, "SG": 32, "ID": 4, "MY": 7, "VN": 8, "AU": 129, "NZ": 65, "GU": 11, "EG": 18, "LY": 4, "ZA": 76, "A1": 2, "Other": 254
//     }};
//
// getData()
// function getData() {
//     d3.json("data/bubble.json",function(data){
//         // console.log(data)
//
//
//     });
// }

var issueStore;

queue()
    .defer(d3.json, "data/CFX-data-scrubbed.json")
    //TODO: add csv file for retrospective data
    .await(dataLoaded);

function dataLoaded(error, jiraData) {
    issueStore = new IssueStore(jiraData);
    // console.log(issueStore.getIssuesForSprint(47785));
    bubbleChart = new BubbleChart("bubble-chart",issueStore)
    storyChart = new StoryChart("story-chart",issueStore)
}


