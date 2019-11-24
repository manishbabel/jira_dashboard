//to be used when only displaying velocity chart

var issueStore;
var velocityChart;
var eventHandler = {};

queue()
    .defer(d3.json, "data/CFX-data-scrubbed.json")
    //TODO: add csv file for retrospective data
    .await(dataLoaded);

function dataLoaded(error, jiraData) {
    issueStore = new IssueStore(jiraData);
    velocityChart = new VelocityChart("vis-velocity", issueStore);

    $(eventHandler).bind("selectedLayerChange", function(event) {
        velocityChart.onSelectedLayerChange(event);
    });

    $(eventHandler).bind("selectedMetricChange", function(event) {
        velocityChart.onSelectedMetricChange(event);
    });
}
