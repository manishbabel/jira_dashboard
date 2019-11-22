
var issueStore;

queue()
    .defer(d3.json, "data/CFX-data-scrubbed.json")
    //TODO: add csv file for retrospective data
    .await(dataLoaded);

function dataLoaded(error, jiraData) {
    issueStore = new IssueStore(jiraData);
    // console.log(issueStore.getIssuesForSprint(47785));
    // (3) Create event handler
    var MyEventHandler = {};
    bubbleChart = new BubbleChart("bubble-chart",issueStore,MyEventHandler)
    storyChart = new StoryChart("story-chart",issueStore)
    employeeChart = new EmployeeChart("employee-chart",issueStore)
    employeeDetailsChart=  new EmployeeDetailsChart("employee",issueStore)
    $(MyEventHandler).bind("selectionChanged", function(event, d) {
        console.log("eventtriggeered",d)
        storyChart.onSelectionChange(d)
        employeeDetailsChart.onSelectionChange(d)
        // ageVis.onSelectionChange(rangeStart,rangeEnd)
        // prioVis.onSelectionChange(rangeStart,rangeEnd)
        // countVis.onSelectionChange(rangeStart,rangeEnd)
    })
}

