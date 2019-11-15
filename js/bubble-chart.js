
BubbleChart = function(_parentElement, _data){
    this.parentElement = _parentElement
    this.data = _data
    this.displayData = []
    this.initVis()
}

BubbleChart.prototype.initVis = function (){
    var vis = this
    const diameter = 600;
    vis.margin = { top: 60, right: 60, bottom: 60, left: 60 };
    vis.width = 1000 -  vis.margin.left -  vis.margin.right
    vis.height = 900 -  vis.margin.top -  vis.margin.bottom;
     vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width",  vis.width -  vis.margin.left -  vis.margin.right )
        .attr("height",  vis.height  )
        // .append("g").attr("transform", "translate(" + 0   + "," + ( vis.width  ) + ")");
    vis.simulation = d3.forceSimulation()
     vis.wrangleData()
}
BubbleChart.prototype.wrangleData = function (){
    var vis = this
    console.log("data",vis.data.getSprints())
    vis.displayData = vis.data.getSprints()
    console.log('displaydata',vis.displayData)
    vis.activeSprint = vis.displayData.filter(function(d){
        return d.state == "ACTIVE"
    })
    vis.activeSprint= vis.activeSprint[0]
    vis.storiesForActiveSprint = vis.data.getIssuesForSprint(vis.activeSprint["id"])
    vis.updateVis()


}
BubbleChart.prototype.updateVis = function (value){
    var vis = this
    console.log(vis.activeSprint)
    console.log(vis.activeSprint['startDate'],vis.activeSprint['endDate'])
    var bubble = vis.svg.selectAll(".bubble")
        .data(vis.storiesForActiveSprint)
        .enter().append("circle")
        .attr("class","bubble")
        .attr("r",10)
        .attr("fill", "lightblue")
        .attr("cx",100)
        .attr("cy",300)
    vis.simulation.nodes(vis.storiesForActiveSprint)

}
