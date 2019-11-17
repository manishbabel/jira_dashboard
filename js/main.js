var issueStore;

// Visualizations
var lineVis;

queue()
    .defer(d3.json, "data/CFX-data-scrubbed.json")
    //TODO: add csv file for retrospective data
    .defer(d3.json, "data/metrics.json")
    .await(dataLoaded);

function dataLoaded(error, jiraData, metrics) {
    issueStore = new IssueStore(jiraData);
    lineVis = new LineChart("line-chart", metrics);
}