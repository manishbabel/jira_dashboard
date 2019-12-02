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
var formatDate = d3.timeFormat("%b-%d")

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

    vis.width = 750 - vis.margin.left - vis.margin.right,
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
        .range([0, vis.width ]).nice(d3.timeDay)
// .domain([0,99]);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0])

    vis.xAxis = d3.axisBottom()
        .scale(vis.x)
        .tickFormat(formatDate)
        .ticks(d3.timeDay)
    vis.yAxis = d3.axisLeft()
        .scale(vis.y);
    // Append axes
    vis.svgElem.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + (vis.height) + ")");

    vis.svgElem.append("g")
        .attr("class", "y-axis axis");
    vis.tooltip = vis.svgElem.append('g')
        .attr('class', 'tooltip');

    vis.line = d3.line()
        .curve(d3.curveStepBefore)
        .x(function(d) {
            console.log("line called:",d)
            return vis.x(d.fulldate); })
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
StoryChart.prototype.wrangleData = function (dataset){
    var vis = this
    console.log("dataset",dataset)
    vis.updateVis(dataset)



}
StoryChart.prototype.updateVis = function (dataset){
    var vis = this
    tip = d3.tip().attr('class', 'd3-tip')
        .html(function(d) {

            var content = "<span style='text-align:center'><b>" + d.id +"("+d.storyPoints+")" + "</b></span><br>";
            content +=`
                    <table style="margin-top: 2.5px;">
                            <tr><td>Assinged to: </td><td style="text-align: right">` + d.assigned+ `</td></tr>
                            <tr><td>Change on: </td><td style="text-align: right">` + d.field + `</td></tr>
                            <tr><td>Field changed from: </td><td style="text-align: right">` + d.fromstr  + `</td></tr>
                            <tr><td>Field changed to:  </td><td style="text-align: right">` +   (d.tostr) + `</td></tr>
                    </table>
                    `;
            return content;
            // return d.fulldate+d.field+d.fromstr+d.tostr;
            });
    vis.svgElem.call(tip)
    // console.log("asdasdad",d3.extent(vis.dataset, function(d) {
    //     return d.date;
    // }))
    dataset = dataset.sort(function(a,b){
        return a.fulldate - b.fulldate
    })
    vis.x.domain([d3.min(dataset,function(d){
        console.log( (d.fulldate) )
        return   (d.fulldate)
    }),
        d3.max(dataset,function(d){ return   (d.fulldate)})])


    // vis.x.domain(d3.extent(dataset, function(d) {
    //     return d.date;
    // }));
    vis.y.domain([0, d3.max(dataset, function(d) { return d.time; })]);

    // vis.svgElem.selectAll(".circle")
    //     .transition()
    //     .duration(3500)
    //     .attr("r", "0")
    //     .style("opacity", "0");

    vis.path
        .datum(dataset)
        .attr("class", "line")
        .attr("id", "line")
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
         .attr("stroke", "rgb(255,74,27)")
        .attr("stroke-width", "2")
        .attr("fill", "none")
        // .attr("transform", "translate(" + vis.trans + ",0)")
        .attr("d", function(d){
            return vis.line(d);
        });
    //
    var totalLength = vis.path.node().getTotalLength();
    //
    vis.path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .delay(300)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .attr("pointer-events", "none");


    // vis.svgElem.select("g.x")
    //     .transition()
    //     .duration(400)
    //     .call(vis.xAxis);
    // vis.svgElem.select("g.y")
    //     .transition()
    //     .duration(400)
    //     .call(vis.yAxis);

    // var bubbles = vis.svgElem.selectAll(".circle").data(dataset);
    //
    // bubbles
    //     .enter()
    //     .append("circle")
    //     .attr("r", "7")
    //     .attr("cx" , function(d){
    //         console.log("111",d)
    //         return vis.x(d.fulldate);
    //     })
    //     .attr("cy" , function(d){
    //         return vis.y(d.time);
    //     })
    //     .attr("class", "circle")
    //     .attr("fill", "orange")
    //     .attr("stroke-width", "2")
    //     .attr("stroke", "orange")
    //     // .attr("transform", "translate(" + vis.trans + ",0)")
    //     // .call(d3.drag())
    //     .on('mouseover', tip.show)
    //     .on('mouseout', tip.hide)
    //
    // bubbles
    //     .exit()
    //     .transition()
    //     // .duration(100)
    //     // .attr("r", "7")
    //     .remove();
    var bubble = vis.svgElem
        .selectAll(".dot")
        .data(dataset)
    bubble.enter()
        .append("circle")
        .merge(bubble)
        .attr("class","dot")
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .merge(bubble).transition()
        .attr("cx", function (d) { return vis.x(d.fulldate); } )
        .attr("cy", function (d) { return vis.y(d.time); } )
        .attr("r", "8" )
        .style("fill", "#80b1d3")
        .style("opacity", "0.7")
        .attr("stroke", "black")


    bubble
        .exit()
        .transition()
        .duration(100)
        .attr("r", "7")
        .remove();


    vis.svgElem.select(".x-axis").call(vis.xAxis);
    // vis.svgElem.select(".y-axis").call(vis.yAxis);
    vis.svgElem.append("text")
        .attr("class", "PT_Serif")
        .attr("text-anchor", "end")
        .attr("x", vis.width)
        .attr("y", vis.height - 6)
        .attr("stroke","#d9d9d9")
        .text("Timeline of the Story");


}

StoryChart.prototype.onSelectionChange = function(d1){
    var vis = this;
    console.log("d1",d1)
    var changelog = d1['changelog']['histories']
    console.log("changelog",changelog)
    var dataset = []
    var listOfAllowedFields = ["Story Points","priority","Rank","assignee","status"]
    changelog.forEach(function(d){
        console.log("indd",d)
        var copiedDate = new Date(d.created);
        console.log("a",copiedDate)
        var myTime = copiedDate.getMinutes()
        if(myTime ==0){
            myTime =10
        }
        if(d1.fields.assignee != null){
            assignee = d1.fields.assignee.displayName
        }
        console.log("myTime",myTime)
        if (listOfAllowedFields.includes(d.items[0].field) ){
            // var a = d.created
            copiedDate.setHours(0,0,0,0);
            dataset.push({field:d.items[0].field,
                tostr:d.items[0].toString,
                fromstr:d.items[0].fromString,
                desc:d.items[0].field +":"+d.items[0].toString,
                fulldate:copiedDate,
                date:new Date(d.created),
                time:myTime,
                storyPoints:d1.storyPoints,
                id:d1.id,
                assigned:assignee})
        }
    })

    if (dataset.length !=0){
        vis.wrangleData(dataset)
    }
}