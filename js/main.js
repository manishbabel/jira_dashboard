var issueStore;

queue()
    .defer(d3.json, "data/CFX-data-scrubbed.json")
    //TODO: add csv file for retrospective data
    .await(dataLoaded);

function dataLoaded(error, jiraData) {
    issueStore = new IssueStore(jiraData);
    console.log(issueStore.getSprints());
}