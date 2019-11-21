//to be used when only displaying velocity chart

var issueStore;

queue()
    .defer(d3.json, "data/CFX-data-scrubbed.json")
    //TODO: add csv file for retrospective data
    .await(dataLoaded);

function dataLoaded(error, jiraData) {
    issueStore = new IssueStore(jiraData);

    issueStore.getIssuesForSprint(48793).forEach(function (issue) {
        console.log(issue.fields.status.name);
    });

    new VelocityChart("vis-velocity", issueStore);
}