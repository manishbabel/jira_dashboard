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
        console.log(scrumTextStore.overview);
        console.log(scrumTextStore.roles);
        console.log(scrumTextStore.ceremonies);
        console.log(scrumTextStore.artifacts);

        const visScrumProcess = new ScrumProcess(scrumTextStore);
        const visVelocity = new VelocityChart(issueStore);
        const visScope = new ScopeChart(issueStore);
        const visRetro = new RetroChart(retroStore);
        const visBurnDown = new BurnDownChart(issueStore);
}




