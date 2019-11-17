document.addEventListener("DOMContentLoaded", () => {

    queue()
        .defer(d3.json, "data/CFX-data-scrubbed.json")
        .defer(d3.json, "data/scrum-process.json")
        .defer(d3.json, "data/metrics.json")
        .await(visualize);
});

function visualize(error, jiraData, scrumText, retroData) {
        const issueStore = new IssueStore(jiraData);
        const scrumTextStore = new ScrumTextStore(scrumText);
        const retroStore = new RetroStore(retroData);

        console.log(issueStore.getSprints());
        console.log(scrumTextStore.ceremonies);
        console.log(retroStore.data);

        const margin = {top: 0, right: 0, bottom: 0, left: 0};
        const marginVelocity = { top: 40, right: 60, bottom: 60, left: 60 };
        const width = 800;
        const height = 200;

        const svgVelocity = new Svg("#velocity-chart", width, height, marginVelocity);
        const svgScope = new Svg("#scope-chart", width/2, height, margin);
        const svgScopeDetail = new Svg("#scope-detail-chart", width/2, height, margin);
        const svgRetro = new Svg("#retrospective-chart", width, height, margin);
        const svgBurnDown = new Svg("#burn-down-chart", width, height, margin);

        const visVelocity = new VelocityChart2(issueStore, svgVelocity);
        const visScopeDetail = new ScopeDetailChart(issueStore, svgScopeDetail);
        const visScope = new ScopeChart(issueStore, svgScope, visScopeDetail);
        const visRetro = new RetroChart(retroData, svgRetro);
        const visBurnDown = new BurnDownChart(issueStore, svgBurnDown);

        //Map clickable elements to the visualization objects which will display
        const actionMapping = {
                "#input-sprint-backlog": visScope,
                "#input-product-increment": visScope,
                "#input-retrospective": visRetro,
                "#input-sprint": visVelocity,
                "#input-daily-scrum": visBurnDown
        };

        const visScrumProcess = new ScrumProcess(scrumTextStore, actionMapping);
}

