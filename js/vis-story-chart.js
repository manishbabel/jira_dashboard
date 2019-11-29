class StoryChart2 {
    constructor(data, svg) {
        this._data = data;
        this._svg = svg;
        this._storyChart = new StoryChart(this.svg.container.substr(1), this.data);
    }

    get data() {return this._data;}
    get svg() {return this._svg;}
    get storyChart() {return this._storyChart;}
}

var dateFormatter = d3.timeFormat("%Y-%m-%d");
var dateParser = d3.timeParse("%Y-%m-%d");

StoryChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];
    this.initVis();
}

StoryChart.prototype.initVis = function (){
    var vis = this;
    vis.margin = { top: 20, right: 20, bottom: 200, left: 60 };

    vis.width = 600 - vis.margin.left - vis.margin.right,
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svgElem = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    d3.selectAll("svgElem > *").remove();

    // Scales and axes
    vis.x = d3.scaleTime()
        .range([0, vis.width])
    // .domain([0,99]);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x).tickFormat(d3.timeFormat("%Y-%m-%d"));

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);
    // Append axes
    vis.svgElem.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svgElem.append("g")
        .attr("class", "y-axis axis");
    vis.tooltip = vis.svgElem.append('g')
        .attr('class', 'tooltip');

    vis.line = d3.line()
        .curve(d3.curveStepBefore)
        .x(function(d) {
            console.log("line called:",d)
            return vis.x(d.date); })
        .y(function(d) { return vis.y(d.time); });
    vis.circle = vis.svgElem.append("circle")
        .attr("r", 7)
        .attr("fill", "orange")
        .style("opacity", "0")
        .attr("pointer-events", "none")
        .attr("stroke-width", "2.5")
        .attr("stroke", "white");

    vis.path, vis.trans = 25, vis.circle;
    vis.path = vis.svgElem.append("path");




}
StoryChart.prototype.wrangleData = function (d){
    console.log("d",d)
    var vis = this
    // console.log("data",vis.data.getSprints())
    // vis.displayData = vis.data.getSprints()
    // // console.log('displaydata',vis.displayData)
    // vis.activeSprint = vis.displayData.filter(function(d){
    //     return d.state == "ACTIVE"
    // })
    // vis.activeSprint= vis.activeSprint[0]
    // vis.storiesForActiveSprint = vis.data.getIssuesForSprint(vis.activeSprint["id"])
    // vis.storyForCurrent = vis.storiesForActiveSprint[0]
    vis.changelog = d['changelog']['histories']
    vis.dataset = []
    vis.changelog.forEach(function(d){
        var date1 =d.created
        console.log((date1))
        var myTime = String(date1).substr(16, 2);
        console.log(dateFormatter(new Date(date1)),myTime)

        vis.dataset.push({desc:d.items[0].field +":"+d.items[0].toString,fulldate:d.created,date: (new Date(date1)),time:myTime})
    })
    console.log("adad",vis.changelog)
    vis.updateVis()



}
StoryChart.prototype.updateVis = function (value){
    var vis = this
    vis.x.domain(d3.extent(vis.dataset, function(d) {
        return d.date;
    }));
    vis.y.domain([0, d3.max(vis.dataset, function(d) { return d.time; })]);

    // vis.svgElem.selectAll(".circle")
    //     .transition()
    //     .duration(3500)
    //     .attr("r", "0")
    //     .style("opacity", "0");

    var totalLength = vis.path.node().getTotalLength();
    vis.path
        .datum(vis.dataset)
        .attr("class", "line")
        .attr("id", "line")
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength);
    vis.path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .delay(300)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .attr("pointer-events", "none");

    vis.path
        .attr("stroke", "rgb(255,74,27)")
        .attr("stroke-width", "2")
        .attr("fill", "none")
        .attr("transform", "translate(" + vis.trans + ",0)")
        .attr("d", function(d){
            return vis.line(d);
        });

    // vis.svgElem.select("g.x")
    //     .transition()
    //     .duration(400)
    //     .call(vis.xAxis);
    // vis.svgElem.select("g.y")
    //     .transition()
    //     .duration(400)
    //     .call(vis.yAxis);

    var bubbles = vis.svgElem.selectAll(".circle").data(vis.dataset);

    bubbles
        .enter()
        .append("circle")
        .attr("r", "7")
        .attr("cx" , function(d){
            console.log("111",d)
            return vis.x(d.date);
        })
        .attr("cy" , function(d){
            return vis.y(d.time);
        })
        .attr("class", "circle")
        .attr("fill", "orange")
        .attr("stroke-width", "2")
        .attr("stroke", "orange")
        // .attr("transform", "translate(" + vis.trans + ",0)")
        .call(d3.drag());

    bubbles
        .exit()
        .transition()
        .duration(100)
        .attr("r", "7")
        .remove();

    // bubbles
    //     .transition()
    //     .duration(100)
    //     .delay(function(d, i) {
    //         return (i / vis.dataset.length * 1000)-500;
    //     })
    //     .attr("r", "7")
    //     .style("opacity", "0")
    //     .attr("cx" , function(d){
    //         console.log("111",d)
    //         return vis.x(d.date);
    //     })
    //     .attr("cy" , function(d){
    //         return vis.y(d.time);
    //     })
    //     .transition()
    //     .duration(500)
    //     .delay(function(d, i) {
    //         return (i / vis.dataset.length * 1000)+500;
    //     })
    //     .style("opacity", "1")
    //     .attr("r", function(d){
    //         return d.z;
    //     })


    vis.svgElem.append("rect")
        .data(vis.dataset)
        .attr('width', vis.width)
        .attr('height', vis.height)
        .attr("fill-opacity", "0")
        .attr("fill", "white")
        .on("mousemove", point)
        .on("mouseover", over)
        .on("mouseleave", leave)
        .attr("transform", "translate(" + vis.trans + ",0)");

      function subject(d) {return { x: 0, y: d3.event.y }};
    vis.drag =  d3.drag()
        .subject(subject)
        .on("start", function () {
            d3.event.sourceEvent.stopPropagation(); // silence other listeners
            if (d3.event.sourceEvent.which == 1)
                dragInitiated = true;
        })
        // .on("dragstart", dragstarted)
        // .on("drag", function(){ dragged(this); })
        // .on("dragend", dragended);

    vis.svgElem.on("click", function(){
        vis.svgElem.append("circle")
            .attr("cx", d3.mouse(this)[0])
            .attr("cy", d3.event.pageY-10)
            .attr("fill", "none")
            .attr("stroke", "#777")
            .attr("r", "0")
            .transition()
            .duration(500)
            .ease("circle")
            .attr("r", "50")
            .attr("stroke", "white")
            .remove();
    });
    tip = d3.tip().attr('class', 'd3-tip')
        .html(function(d) {

            return d.desc; });
    vis.svgElem.call(tip)

    console.log("extent",d3.extent(vis.dataset, function(d) { return d.date; }))
    console.log("changelog",vis.changelog)
    console.log("dataset",vis.dataset)
    console.log("asddads",vis.x(new Date("2019-10-02")))
    function point(){
        var pathEl = vis.path.node();
        var pathLength = pathEl.getTotalLength();
        var BBox = pathEl.getBBox();
        var scale = pathLength/BBox.width;
        var offsetLeft = document.getElementById("line").offsetLeft;
        var _x = d3.mouse(this)[0];
        var beginning = _x , end = pathLength, target;
        while (true) {
            target = Math.floor((beginning + end) / 2);
            pos = pathEl.getPointAtLength(target);

            if ((target === end || target === beginning) && pos.x !== _x) {
                break;
            }
            if (pos.x > _x){
                end = target;
            }else if(pos.x < _x){
                beginning = target;
            }else{
                break; //position found
            }
        }
        vis.circle
            .attr("opacity", 1)
            .attr("cx", _x+ vis.trans)
            .attr("cy", pos.y);

    }
    function over(){
        bubbles.transition().duration(200).style("opacity", "1");
    }
    function leave(){
        bubbles.transition().duration(200).style("opacity", "0");
    }
    function dragstarted(d){
        d3.select(this).style("cursor", "pointer");
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).attr("fill", "brown");
    }
    function dragged(d){
        //d3.select(this).attr("cx", +d3.select(this).attr("cx") + d3.event.dx).attr("cy", +d3.select(this).attr("cy") + d3.event.dy)
        //d3.select(this).attr("cy", +d3.select(this).attr("cy") + d3.event.dy);
        var x = d3.select(d).attr("cx");
        var y = d3.select(d).attr("cy");
        var cradius = d3.select(d).attr("r");
        var cx = Math.min(vis.width,+x + d3.event.dx);
        var cy = Math.min(vis.height,+y + d3.event.dy);
        var draggedCircles = [{ "x": cx, "y": cy, "radius": cradius }];

        d3.select(d)
            .data(draggedCircles)

            .attr("cy", function (d) { return d.y; });
    }

    function dragended(d){
        d3.select(this)
            .style("cursor", "");
        d3.select(this).attr("fill", "steelblue");
    }
    vis.svgElem.select(".x-axis").call(vis.xAxis).selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d) {
            return "rotate(-45)"
        })
    // vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svgElem.select(".y-axis").call(vis.yAxis);

}

StoryChart.prototype.onSelectionChange = function(d){
    var vis = this;
    // console.log(selectionStart)
    //
    // console.log(selectionEnd)
    // Filter original unfiltered data depending on selected time period (brush)

    // *** TO-DO ***
    // vis.filteredData = vis.data.filter(function(d) {
    //     return d.time >= selectionStart && d.time <= selectionEnd
    // })

    vis.wrangleData(d);
}