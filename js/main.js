let eventHandler = {};
const useSampleData = false;

document.addEventListener("DOMContentLoaded", () => {

    queue()
        .defer(d3.json, (useSampleData ? "data/CFX-data-scrubbed.json" : "data/JV-12-3-19.json"))
        .defer(d3.json, "data/scrum-process.json")
        .defer(d3.json, "data/metrics.json")
        .await(visualize);
});

function visualize(error, jiraData, scrumText, retroData, test) {
        const issueStore = (useSampleData ? new IssueStore(jiraData) : new IssueStore(jiraData, "customfield_10020", "customfield_10028" )) ;
        const scrumTextStore = new ScrumTextStore(scrumText);
        const retroStore = new RetroStore(retroData);

        console.log(issueStore.getSprints());
        console.log(scrumTextStore.ceremonies);
        console.log(retroStore.data);

        const margin = {top: 0, right: 0, bottom: 0, left: 0};
        const marginVelocity = { top: 40, right: 65, bottom: 60, left: 60 };
        const marginScope = { top: 60, right: 60, bottom: 60, left: 60 };
        const marginRetro = { top: 70, right: 60, bottom: 50, left: 60 };
        const width = 800;
        const height = 200;
        const colorScheme = d3.schemeCategory20;

        const svgVelocity = new Svg("#velocity-chart", -1, 400, marginVelocity);
        const svgScope = new Svg("#scope-chart", width/2, height, marginScope);
        const svgStory = new Svg("#story-chart", width/2, height, margin);
        const svgRetro = new Svg("#retrospective-chart", 600, 400, marginRetro);
        const svgBurnDown = new Svg("#burn-down-chart", width, height, margin);
        const svgEmployee = new Svg("#employee-chart", width, height, margin);

        const visVelocity = new VelocityChart2(issueStore, svgVelocity, colorScheme, eventHandler);
        const visStory = new StoryChart2(issueStore, svgStory);
        const visScope = new ScopeChart(issueStore, svgScope, visStory,'', colorScheme, eventHandler);
        const visRetro = new RetroChart(retroData, svgRetro);
        const visBurnDown = new BurnDownChart(issueStore, svgBurnDown);
        const visEmployee = new EmployeeChart2(issueStore, svgEmployee);

        //Map clickable elements to the visualization objects which will display
        const actionMapping = {
                "#input-sprint-backlog": [visScope, visStory],
                "#input-product-increment": [visScope, visStory],
                "#input-retrospective": [visRetro],
                "#input-sprint": [visVelocity]
        };
        const visScrumProcess = new ScrumProcess(issueStore, scrumTextStore, retroStore, actionMapping);

        //Bind events
        $(eventHandler).bind("selectedIssuePropertyChange", function(event, selection) {
                issueStore.onSelectedIssuePropertyChange(selection, function () {
                        visVelocity.onSelectedLayerChange(selection);
                        visScope.wrangleData();
                });
                $(eventHandler).trigger("selectedSprintChange", 1);
        });

        $(eventHandler).bind("selectedSprintChange", (event, selection) => {
                issueStore.onSelectedSprintChange(selection, ()=> {
                        alert("sprint selection is " + selection);
                        //todo update scope chart
                        //todo update sprint cards
                });
        });


}

