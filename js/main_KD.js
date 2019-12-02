var eventHandler = {};

document.addEventListener("DOMContentLoaded", () => {

    queue()
        .defer(d3.json, "data/CFX-data-scrubbed.json")
        .defer(d3.json, "data/scrum-process.json")
        .defer(d3.json, "data/metrics.json")
        .await(visualize);
});

function visualize(error, jiraData, scrumText, retroData) {
        const svgRetro = new LineChart("line-chart", retroData);
}

