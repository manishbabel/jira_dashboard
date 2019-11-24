
var issueStore;

queue()
    .defer(d3.json, "data/CFX-data-scrubbed.json")
    //TODO: add csv file for retrospective data
    .await(dataLoaded);

function dataLoaded(error, jiraData) {
    issueStore = new IssueStore(jiraData);
    // console.log(issueStore.getIssuesForSprint(47785));
    // (3) Create event handler
    const MyEventHandler = {};
    const bubbleChart = new BubbleChart("bubble-chart", issueStore, MyEventHandler);
    const storyChart = new StoryChart("story-chart", issueStore);
    const employeeChart = new EmployeeChart("employee-chart", issueStore);
    $(MyEventHandler).bind("selectionChanged", function(event, d) {
        console.log("eventtriggeered",d);
        storyChart.onSelectionChange(d);
    });
}

