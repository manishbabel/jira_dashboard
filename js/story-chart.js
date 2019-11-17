
var dateFormatter = d3.timeFormat("%Y-%m-%d");
var dateParser = d3.timeParse("%Y-%m-%d");


StoryChart = function(_parentElement, _data){
    this.parentElement = _parentElement
    this.data = _data
    this.displayData = []
    this.initVis()
}

StoryChart.prototype.initVis = function (){
    var vis = this
    const diameter = 600;
    vis.margin = { top: 60, right: 60, bottom: 60, left: 60 };
    vis.width = 700
    vis.height = 600


    vis.pack = d3.pack()
        .size([ vis.width,  vis.height])
        .padding(1.5);

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width",  vis.width  )
        .attr("height",  vis.height  )
        // .append("g").attr("transform", "translate(" + 10   + "," + 800 + ")");
         vis.wrangleData()
}
StoryChart.prototype.wrangleData = function (){
    var vis = this
    // console.log("data",vis.data.getSprints())
    vis.displayData = vis.data.getSprints()
    // console.log('displaydata',vis.displayData)
    vis.activeSprint = vis.displayData.filter(function(d){
        return d.state == "ACTIVE"
    })
    vis.activeSprint= vis.activeSprint[0]
    vis.storiesForActiveSprint = vis.data.getIssuesForSprint(vis.activeSprint["id"])
    vis.storyForCurrent = vis.storiesForActiveSprint[0]
    vis.changelog = vis.storyForCurrent['changelog']['histories']
    vis.updateVis()


}
StoryChart.prototype.updateVis = function (value){
    var vis = this
    console.log("changelog",vis.changelog)
    startDate = dateFormatter(vis.activeSprint['startDate'])
    endDate = dateFormatter(vis.activeSprint['endDate'])
    var image = vis.svg.append("image")
        .attr("xlink:href", "img/run.jpg")
        .attr("class","image")
        .attr("x",100)
        .attr("y",60)

    var circles = vis.svg.selectAll(".bubble")
        .data(vis.changelog)
        .enter().append("circle")
        .attr("class","bubble")
        .attr("r","40")
        .attr("fill", "grey")
        .attr("cx",function(d,i){
            return 50+(i*120)
        })
        .attr("cy",300)
        .on("click",function(d){
            console.log(d)
        })
    vis.svg
        .selectAll(".mylabels")
        .data(vis.changelog)
        .enter()
        .append("text")
        .attr("class","mylabels")
        .attr("x", function(d,i){
            return 50+(i*125)
        })
        .attr("y", function(d,i){
            return 380
        })
        .text(function(d){
            console.log( (d.items[0].toString))
            a =d.items[0].toString
            if (a.length > 25){
                return "testing"
            }else{
                return a
            }
             })
        .style("text-anchor", "middle")



}
function createNodes1(source,vis) {
    // console.log("source",source)
    let root = d3.hierarchy({ children: source })
        .sum(d => d.value);
    console.log("root",root)
    const rootData = vis.pack(root).leaves().map((d, i) => {
        const data = d.data;
        console.log("data",d)
        const color = scaleColor(data.id);
        return {
            x: vis.centerX + (d.x - vis.centerX) * 3,
            y: vis.centerY + (d.y - vis.centerY) * 3,
            id: "bubble" + i,
            r: 0,
            radius: data.storyPoints * 50,
            value: data.items,
            name: dateFormatter(new Date(data.created)),
            id:data.id,
            color: color,
        }
    });

    // sort them to prevent occlusion of smaller nodes.
    // rootData.sort((a, b) => b.value - a.value);
    console.log(rootData)
    return rootData;
}