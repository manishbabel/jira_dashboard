
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



    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width",  vis.width -  vis.margin.left -  vis.margin.right )
        .attr("height",  vis.height  )
        // .append("g").attr("transform", "translate(" + 10   + "," + 800 + ")");
    // Scales and axes
    vis.x = d3.scaleTime()
        .range([0, vis.width]);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y)
        .ticks(6);


    // Set domains
    var minMaxY= [0, 24];
    vis.y.domain(minMaxY);

    var minMaxX = d3.extent([1,2,3,4]);
    vis.x.domain(minMaxX);

    vis.svg.append("g")
        .attr("class", "x-axis axis").style("fill","red")
        .attr("transform", "translate("+20+"," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis")
        .style("fill","red")
        // .attr("transform", "translate( "+vis.height+"," + 10 + ")");

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
    // Set domains
    var minMaxY= [0, 24];
    vis.y.domain(minMaxY);
    time = []
    dates=[]
    vis.changelog.forEach(function(d){
        date = new Date(d.created)
        var minute = date.getUTCMinutes();
        var hour = date.getUTCHours();
        var a = parseInt(hour) + parseInt(minute)/60
        time.push(a)
        dates.push(date.getDate())
    })

    console.log(time,dates);
    var minMaxX = [0,31]
    // console.log('minMaxX',minMaxX)
    vis.x.domain(minMaxX);

    // Call axis functions with the new domain
    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);

    bubble = vis.svg.selectAll(".bubble")
        .data(vis.changelog
        )
        .enter().append("g")
        .attr("class", "bubble")
        // .call(d3.drag()
        .call(d3.drag()
            .on("start", (d) => {
                if (!d3.event.active) { simulation.alphaTarget(0.2).restart(); }
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (d) => {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            })
            .on("end", (d) => {
                if (!d3.event.active) { simulation.alphaTarget(0); }
                d.fx = null;
                d.fy = null;
            })
        )

}
function createNodes(source,vis) {
    // console.log("source",source)
    let root = d3.hierarchy({ children: source })
        .sum(d => d.value);
    // console.log("root",root)
    const rootData = vis.pack(root).leaves().map((d, i) => {
        const data = d.data;
        // console.log("data",d)
        const color = scaleColor(data.fields.issuetype.name);
        return {
            x: vis.centerX + (d.x - vis.centerX) * 3,
            y: vis.centerY + (d.y - vis.centerY) * 3,
            id: "bubble" + i,
            r: 0,
            radius: data.storyPoints * 50,
            value: data.storyPoints,
            name: data.fields.issuetype.name,
            color: color,
        }
    });

    // sort them to prevent occlusion of smaller nodes.
    rootData.sort((a, b) => b.value - a.value);
    return rootData;
}