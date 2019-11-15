
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
    vis.width = 700 -  vis.margin.left -  vis.margin.right
    vis.height = 600 -  vis.margin.top -  vis.margin.bottom;


    vis.pack = d3.pack()
        .size([ vis.width,  vis.height])
        .padding(1.5);

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width",  vis.width -  vis.margin.left -  vis.margin.right )
        .attr("height",  vis.height  )
        // .append("g").attr("transform", "translate(" + 10   + "," + 800 + ")");
    // Scales and axes
    // List of node names
    // List of node names

    // A linear scale to position the nodes on the X axis
    vis.x = d3.scalePoint()
        .range([0, vis.width])
        // .domain(allNodes)

    // Add the circle for the nodes

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
    data = createNodes1(vis.changelog,vis)
    var allNodes = data.map(function(d){return d.name})
    vis.x.domain(allNodes)
    vis.svg
        .selectAll("mynodes")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function(d){ return(vis.x(d.name))})
        .attr("cy", vis.height-30)
        .attr("r", 8)
        .style("fill", "#69b3a2")

    // And give them a label
    vis.svg
        .selectAll("mylabels")
        .data(data)
        .enter()
        .append("text")
        .attr("x", function(d){ return(vis.x(d.name))})
        .attr("y", vis.height-10)
        .text(function(d){ return(d.name)})
        .style("text-anchor", "middle")

    // Add links between nodes. Here is the tricky part.
    // In my input data, links are provided between nodes -id-, NOT between node names.
    // So I have to do a link between this id and the name
    var idToNode = {};
    data.forEach(function (n) {
        idToNode[n.id] = n;
    });
    // Cool, now if I do idToNode["2"].name I've got the name of the node with id 2

    // Add the links
    vis.svg
        .selectAll('mylinks')
        .data(data)
        .enter()
        .append('path')
        .attr('d', function (d) {
            start = vis.x(idToNode[d.source].name)    // X position of start node on the X axis
            end = vis.x(idToNode[d.target].name)      // X position of end node
            return ['M', start, vis.height-30,    // the arc starts at the coordinate x=start, y=height-30 (where the starting node is)
                'A',                            // This means we're gonna build an elliptical arc
                (start - end)/2, ',',    // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
                (start - end)/2, 0, 0, ',',
                start < end ? 1 : 0, end, ',', vis.height-30] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
                .join(' ');
        })
        .style("fill", "none")
        .attr("stroke", "black")

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