IssuePropertyControl = function(_svg, _colorScheme, _eventHandler, _issueStore) {
        this.svg = _svg;
        this.colorScheme = _colorScheme;
        this.eventHandler = _eventHandler;
        this.issueStore = _issueStore;
        this.initVis();
    };

IssuePropertyControl.prototype.initVis = function(){
        var vis = this;

        vis.svg
        .append("g")
            .attr("class", "colorLegend");

        vis.selectedProperty = vis.issueStore.selectedIssueProperty;
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

    d3.selectAll(".colorLegend").attr("transform", "translate(0,10)");

    d3.selectAll(".colorLegend")
        .call(legend);
}