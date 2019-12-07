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
const formatDate = d3.timeFormat("%b-%d")
const dateFormatter = d3.timeFormat("%Y-%m-%d");
const dateParser = d3.timeParse("%Y-%m-%d");

StoryChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];
    this.initVis();
}

StoryChart.prototype.initVis = function (){
    const vis = this;
    vis.margin = { top: 20, right: 20, bottom: 200, left: 60 };

    vis.width = 750 - vis.margin.left - vis.margin.right,
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

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

    vis.y = d3.scaleLinear()
        .range([vis.height, 150])

    vis.xAxis = d3.axisBottom()
        .scale(vis.x)
        .tickFormat(formatDate)
        .ticks(d3.timeDay);
    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

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
    const vis = this;
    vis.updateVis(dataset)

}
StoryChart.prototype.updateVis = function (dataset){
    const vis = this;

    //tooltip
    tip = d3.tip().attr('class', 'd3-tip')
        .html(function(d) {

            var content = "<span style='text-align:center'><b>" + d.id+"</b></span><br>";
            content +=`
                    <table style="margin-top: 2.5px;">
                            <tr><td>Assinged to: </td><td style="text-align: right">` + d.assigned+ `</td></tr>
                            <tr><td>Change on: </td><td style="text-align: right">` + d.field + `</td></tr>
                            <tr><td>Field changed from: </td><td style="text-align: right">` + d.fromstr  + `</td></tr>
                            <tr><td>Field changed to:  </td><td style="text-align: right">` +   (d.tostr) + `</td></tr>
                    </table>
                    `;
            return content;
            });
    vis.svgElem.call(tip)
    dataset = dataset.sort(function(a,b){
        return a.fulldate - b.fulldate
    })
    vis.x.domain([d3.min(dataset,d => d.fulldate),
        d3.max(dataset,function(d){ return   (d.fulldate)})])
    vis.y.domain([0, d3.max(dataset, function(d) { return d.time; })]);
    vis.path
        .datum(dataset)
        .attr("class", "line")
        .attr("id", "line")
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
         .attr("stroke", "rgb(255,74,27)")
        .attr("stroke-width", "2")
        .attr("fill", "none")
        .attr("d", function(d){
            return vis.line(d);
        });
    var totalLength = vis.path.node().getTotalLength();
    vis.path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .delay(300)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .attr("pointer-events", "none");
    let bubble = vis.svgElem
        .selectAll(".dot")
        .data(dataset);
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
        .style("opacity", "1")
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
    const vis = this;
    var changelog = d1['changelog']['histories']
    var dataset = []
    var listOfAllowedFields = ["Story Points","priority","Rank","assignee","status"]
    generateDynamicText(d1);
    vis.svgElem.append("text")
        .attr("class", "story-text1 ")
        .attr("x", 10)
        .attr("y", vis.height - 340)
        .attr("font-family", "Solway")
        .attr("font-size", "14px")
        .text("");

    vis.svgElem.append("text")
        .attr("class", "story-text2")
        .attr("x", 10)
        .attr("y", vis.height - 320)
        .attr("font-family", "Solway")
        .attr("font-size", "14px")
        .text("");

    vis.svgElem.append("text")
        .attr("class", "story-text3")
        .attr("x", 10)
        .attr("y", vis.height - 300)
        .attr("font-family", "Solway")
        .attr("font-size", "14px")
        .text("");
    changelog.forEach(function(d){
        let copiedDate = new Date(d.created);
        let myTime = copiedDate.getMinutes();
        if(myTime ==0){
            myTime =10
        }
        if(d1.fields.assignee != null){
            assignee = d1.fields.assignee.displayName
        }
        if (listOfAllowedFields.includes(d.items[0].field) ){

            if(d.items[0].fromString == null){
                fStr = ""
            }else{
                fStr = d.items[0].fromString
            }
            if(d.items[0].toString == null){
                toStr = ""
            }else{
                toStr = d.items[0].toString
            }
            copiedDate.setHours(0,0,0,0);
            dataset.push({field:d.items[0].field,
                tostr:toStr,
                fromstr:fStr,
                desc:d.items[0].field +":"+d.items[0].toString,
                fulldate:copiedDate,
                date:new Date(d.created),
                time:myTime,
                storyPoints:d1.storyPoints,
                id:d1.key,
                assigned:assignee})
        }
    })

    if (dataset.length !=0){
        vis.wrangleData(dataset)
    }
}

function generateDynamicText(d) {
    var assigneeDesc = ""
    var storyDesc = ""
    console.log("hello",d)
    if (d.fields.summary == null) {
        storyDesc = ""
    } else {
        storyDesc = "Goal of this story is to " + d.fields.summary
    }
    if (d.fields.assignee == null) {
        assigneeDesc = "This story is unassigned"
    } else {
        if (d.isResolved == true) {
            assigneeDesc = d.fields.assignee.displayName + " completed "+d.key+" story"

        } else {
            assigneeDesc = d.fields.assignee.displayName + " is working on "+d.key+" story"

        }
    }
    d3.select(".story-text1").text(assigneeDesc)
    d3.select(".story-text2").text("This story is of " + d.storyPoints + " points.")
    d3.select(".story-text3").text(storyDesc)
}