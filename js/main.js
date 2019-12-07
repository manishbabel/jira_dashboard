let eventHandler = {};
const useSampleData = false;

document.addEventListener("DOMContentLoaded", () => {

    queue()
        .defer(d3.json, (useSampleData ? "data/CFX-data-scrubbed.json" : "data/JV-12-6-19.json"))
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
        const svgRetro = new Svg("#retrospective-chart", 0, 0, marginRetro);
        const svgBurnDown = new Svg("#burn-down-chart", width, height, margin);
        const svgEmployee = new Svg("#employee-chart", width, height, margin);

        const visVelocity = new VelocityChart2(issueStore, svgVelocity, colorScheme, eventHandler);
        const visStory = new StoryChart2(issueStore, svgStory);
        const visScope = new ScopeChart(issueStore, svgScope, visStory,'', colorScheme, eventHandler);
        const visRetro = new RetroChart(retroData.slice(16,21), svgRetro);
        const visBurnDown = new BurnDownChart(issueStore, svgBurnDown);
        const visEmployee = new EmployeeChart2(issueStore, svgEmployee);

        //Map clickable elements to the visualization objects which will display
        const actionMapping = {
                "#input-sprint": [visScope, visStory],
                "#input-product-increment": [visScope, visStory],
                "#input-retrospective": [visRetro],
                "#input-sprint-planning": [visVelocity]
        };
        const visScrumProcess = new ScrumProcess(issueStore, scrumTextStore, retroStore, actionMapping);

        //Bind events
        $(eventHandler).bind("selectedIssuePropertyChange", function(event, selection) {
                issueStore.onSelectedIssuePropertyChange(selection, function () {
                        visVelocity.onSelectedLayerChange(selection);
                        visScope.updateSelectedProperty();
                });
        });

        $(eventHandler).bind("selectedSprintChange", (event, selection) => {
                issueStore.onSelectedSprintChange(selection, ()=> {
                        visScope.updateVis();
                        //todo update sprint cards
                });
        });

        //bind triggers
        d3.select("#issue-property-selector").on("change", function () {
                $(eventHandler).trigger("selectedIssuePropertyChange", d3.select("#issue-property-selector").property("value"));
        });

        d3.select("#issue-metric-selector").on("change", function () {
                $(eventHandler).trigger("selectedMetricChange", d3.select("#issue-metric-selector").property("value"));
        });


}

