const breakdownOptions = [
    {value: "priorities", displayName: "Priorities", selected:true},
    {value: "components", displayName: "Components"},
    {value: "issueType", displayName: "Issue Type"}
];

const issuePropertySelection = `<div id="issuePropertySelectionContainer"><select class="select" id="issuePropertySelection">
                ${breakdownOptions.map(function (option) {
    return `<option value=${option.value} ${option.selected ? "selected" : ""}>${option.displayName}</option>`
}).join('')}
            </select></div>`;

IssuePropertyControl = function(_data, _svg, _colorScheme, _eventHandler, _issueStore) {
        this.data = _data;
        this.svg = _svg;
        this.colorScheme = _colorScheme;
        this.eventHandler = _eventHandler;
        this.issueStore = _issueStore;
        this.initVis();
    };

IssuePropertyControl.prototype.initVis = function(){
        var vis = this;

        $(vis.svg.container).html(issuePropertySelection);

        //bind listender
        d3.select("#issuePropertySelection").on("change", function () {
            $(vis.eventHandler).trigger("selectedIssuePropertyChange", d3.select("#issuePropertySelection").property("value"));
            vis.updateVis();
         });

        console.log(d3.select(vis.svg.container + " svg"));
        //.attr("background-color", "red");

        vis.selectionSvg = d3.select(vis.svg.container)
        .append("svg")
        .attr("width", vis.svg.width)
        .attr("height", vis.svg.height)
        .append("g")
            .attr("class", "colorLegend");

        vis.updateVis();

    };

IssuePropertyControl.prototype.updateVis = function() {
    var vis = this;

    var colorScale = d3.scaleOrdinal();
    colorScale.domain(vis.issueStore.selectedIssueProperty);
    colorScale.range(vis.colorScheme.filter(function (d,i) {
        //needed as the legend needs the domain and range lengths to match
        return i < vis.issueStore.selectedIssueProperty.length;
    }));


    var legend = d3.legendColor()
            .shapeWidth(30)
            .orient("verticle")
            .scale(colorScale)
            .cells(vis.issueStore.selectedIssueProperty.length)
    ;

    d3.select(".colorLegend").attr("transform", "translate(0,10)");

    d3.select(".colorLegend")
        .call(legend);
}