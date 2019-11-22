
var dateFormatter = d3.timeFormat("%Y-%m-%d");
var dateParser = d3.timeParse("%Y-%m-%d");


StoryChart = function(_parentElement, _data){
    this.parentElement = _parentElement
    this.data = _data
    this.displayData = []
    this.initVis()
}

StoryChart.prototype.initVis = function (){
    var vis = this;

    vis.margin = { top: 20, right: 20, bottom: 200, left: 60 };

    vis.width = 600 - vis.margin.left - vis.margin.right,
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");



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
    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");
    vis.tooltip = vis.svg.append('g')
        .attr('class', 'tooltip');




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
    vis.updateVis()



}
StoryChart.prototype.updateVis = function (value){
    var vis = this
    tip = d3.tip().attr('class', 'd3-tip')
            .html(function(d) {

                return d.desc; });
    vis.svg.call(tip)

    console.log("extent",d3.extent(vis.dataset, function(d) { return d.date; }))
    vis.x.domain(d3.extent(vis.dataset, function(d) {
        return d.date;
    }));
    vis.y.domain([0, d3.max(vis.dataset, function(d) { return d.time; })]);
    console.log("changelog",vis.changelog)
    console.log("dataset",vis.dataset)
    console.log("asddads",vis.x(new Date("2019-10-02")))
    var image = vis.svg.select("#employee").append("div").append("image")
        .attr("xlink:href", "img/1.png")
        .attr("class","image")
        .attr("x",50)
        .attr("y",20)

    var bubble = vis.svg
        .selectAll(".dot")
        .data(vis.dataset)
    bubble.enter()
        .append("circle")
        .attr("class","dot")
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .merge(bubble).transition()
        .attr("cx", function (d) { return vis.x(d.date); } )
        .attr("cy", function (d) { return vis.y(d.time); } )
        .attr("r", "8" )
        .style("fill", "#69b3a2")
        .style("opacity", "0.7")
        .attr("stroke", "black")


    bubble.exit().remove()

    // startDate = dateFormatter(vis.activeSprint['startDate'])
    // endDate = dateFormatter(vis.activeSprint['endDate'])

    // var circles = vis.svg.selectAll(".bubble")
    //     .data(vis.changelog)
    // circles.enter().append("circle")
    //     .attr("class","bubble")
    //     .merge(circles)
    //     .attr("r","10")
    //     .attr("fill", "grey")
    //     .attr("cx",function(d,i){
    //         return 50+(i*120)
    //     })
    //     .attr("cy",300)
    //     .on("click",function(d){
    //         console.log(d)
    //     })
    // circles.exit().remove()
    // var labels = vis.svg
    //     .selectAll(".mylabels")
    //     .data(vis.changelog)
    // labels.enter()
    //     .append("text")
    //     .attr("class","mylabels")
    //     .merge(labels)
    //     .attr("x", function(d,i){
    //         return 50+(i*125)
    //     })
    //     .attr("y", function(d,i){
    //         return 380
    //     })
    //     .text(function(d){
    //         console.log( (d.items[0].toString))
    //         a = d.items[0].toString
    //         if (a!=null && a.length > 25){
    //             return d.items[0].field +":"+"testing"
    //         }else{
    //             return d.items[0].field +":"+a
    //         }
    //          })
    //     .style("text-anchor", "middle")
    //
    // labels.exit().remove()
   // console.log(vis.x.domain("2019-11-02"))

    vis.svg.select(".x-axis").call(vis.xAxis).selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d) {
            return "rotate(-45)"
        })
    // vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);


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