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

const dateFormatter = d3.timeFormat("%Y-%m-%d");
const dateParser = d3.timeParse("%Y-%m-%d");

StoryChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];
    this.initVis();
}

StoryChart.prototype.initVis = function (){
    const vis = this
    const diameter = 600;
    vis.margin = { top: 60, right: 60, bottom: 60, left: 60 };
    vis.width = 700
    vis.height = 600

    vis.pack = d3.pack()
        .size([ vis.width,  vis.height])
        .padding(1.5);

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width",  vis.width  )
        .attr("height",  vis.height  );
        // .append("g").attr("transform", "translate(" + 10   + "," + 800 + ")");
    vis.wrangleData();
}
StoryChart.prototype.wrangleData = function (){
    const vis = this;
    // console.log("data",vis.data.getSprints())
    vis.displayData = vis.data.getSprints();
    // console.log('displaydata',vis.displayData)
    vis.activeSprint = vis.displayData.filter(function(d){
        return d.state == "ACTIVE"
    });
    vis.activeSprint= vis.activeSprint[0];
    vis.storiesForActiveSprint = vis.data.getIssuesForSprint(vis.activeSprint["id"])
    vis.storyForCurrent = vis.storiesForActiveSprint[0];
    vis.changelog = vis.storyForCurrent['changelog']['histories'];
    vis.updateVis();


}
StoryChart.prototype.updateVis = function (value){
    var vis = this
    console.log("changelog",vis.changelog);
    startDate = dateFormatter(vis.activeSprint['startDate']);
    endDate = dateFormatter(vis.activeSprint['endDate']);
    var image = vis.svg.append("image")
        .attr("xlink:href", "img/run.jpg")
        .attr("class","image")
        .attr("x",100)
        .attr("y",60);

    var circles = vis.svg.selectAll(".bubble")
        .data(vis.changelog)
        .enter().append("circle")
        .attr("class","bubble")
        .attr("r","40")
        .attr("fill", "grey")
        .attr("cx",(d,i) => 50+(i*120))
        .attr("cy",300)
        .on("click", d => { console.log(d);})
    vis.svg
        .selectAll(".mylabels")
        .data(vis.changelog)
        .enter()
        .append("text")
        .attr("class","mylabels")
        .attr("x", (d,i) => 50+(i*125))
        .attr("y", (d,i) => 380)
        .text(d => {
            console.log( (d.items[0].toString));
            const a = d.items[0].toString;
            return (a.length > 25) ? "testing" : a; })
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