document.addEventListener("DOMContentLoaded", () => {

    queue()
    //TODO: Replace with Kevin's csv file for retrospective data
        .defer(d3.json, "data/CFX-data-scrubbed.json")
        .defer(d3.json, "data/scrum-process.json")
        .defer(d3.json, "data/retrospective.json")
        .await(visualize);
});

function visualize(error, jiraData, scrumText, retroData) {
        const issueStore = new IssueStore(jiraData);
        const scrumTextStore = new ScrumTextStore(scrumText);
        const retroStore = new RetroStore(retroData);

        const sprints = issueStore.getSprints();
        console.log(sprints);
        console.log(retroStore.getScores(1));
        console.log(scrumTextStore.ceremonies);

        const margin = {top: 0, right: 0, bottom: 0, left: 0};
        const width = 800;
        const height = 200;

        const svgVelocity = new Svg("#velocity-chart", width/2, height, margin);
        const svgScope = new Svg("#scope-chart", width/2, height, margin);
        const svgScopeDetail = new Svg("#scope-detail-chart", width/2, height, margin);
        const svgRetro = new Svg("#retrospective-chart", width, height, margin);
        const svgBurnDown = new Svg("#burn-down-chart", width/2, height, margin);

        const visVelocity = new VelocityChart(issueStore, svgVelocity);
        const visScopeDetail = new ScopeDetailChart(issueStore, svgScopeDetail);
        const visScope = new ScopeChart(issueStore, svgScope, visScopeDetail);
        const visRetro = new RetroChart(retroStore, svgRetro);
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



