
const scaleColor = d3.scaleOrdinal(d3.schemeCategory20);
let forceCollide = d3.forceCollide(d => d.r + 1); // create a circle collision force.


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
    vis.width = 900 -  vis.margin.left -  vis.margin.right
    vis.height = 800 -  vis.margin.top -  vis.margin.bottom;
    vis.center = {
        x: vis.width/2,
        y: vis.height/2
    }
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width",  vis.width  )
        .attr("height",  vis.height  )
        // .append("g").attr("transform", "translate(" + 0   + "," + ( vis.width  ) + ")");


    // use pack to calculate radius of the circle
    // const pack_width = document.body.clientWidth;
    // const pack_height = document.body.clientHeight;
    vis.centerX =  vis.width * 0.5;
    vis.centerY =  vis.width * 0.5;

    vis.pack = d3.pack()
        .size([ vis.width,  vis.height])
        .padding(1.5);

    // Strength to apply to the position forces
    const forceStrength = 0.15;

    simulation = d3.forceSimulation()
        .force("x", d3.forceX(vis.centerX).strength(forceStrength))
        .force("y", d3.forceY(vis.centerY).strength(forceStrength))
        .force("charge", d3.forceManyBody())////-Math.pow(d.radius, 2.0) * forceStrength)
        .force("collide", forceCollide);

    vis.wrangleData()
}
BubbleChart.prototype.wrangleData = function (){
    var vis = this

    vis.displayData = vis.data
    vis.updateVis()


}
BubbleChart.prototype.updateVis = function (value){
    var vis = this

    const nodes = createNodes(vis.displayData,vis);
    console.log('nodes',nodes);
    simulation.nodes(nodes).on("tick", ticked);

    bubble = vis.svg.selectAll(".bubble")
        .data(nodes)
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

    // .on("mouseover", d => {
    //  d3.select("#"+d.id).attr("fill", d3.color(d.color).brighter());
    // }).on("mouseout", d => {
    //  d3.select("#"+d.id).attr("fill", d.color);
    // });

    // var href = bubble.append("a")
    //     .attr("href", "j")
    //     .attr("target", "_blank");

    bubble.append("circle")
        .attr("id", d => d.id)
        .attr("r", 1e-6)
        .attr("fill", d => d.color)
        .transition().duration(2000).ease(d3.easeElasticOut)
        .tween("circleIn", d => {
            let i = d3.interpolateNumber(0, d.radius);
            return (t) => {
                d.r = i(t);
                simulation.force("collide", forceCollide);
            };
        });

    bubble.append("text")
        .attr("dy", d => "0.35em")
        .text(d => d.name);

    // var legendRectSize = 20;
    // var legendSpacing = 10;
    //
    // var legend = vis.svg
    //     .selectAll('.legend')
    //     .data(scaleColor.domain())
    //     .enter()
    //     .append('g')
    //     .attr('class', 'legend')
    //     .attr('transform', function (d, i) {
    //         var height = legendRectSize + legendSpacing
    //         var offset = height * scaleColor.domain().length / 2
    //         var horz = 6    * legendRectSize
    //         var vert = i * height //- offset
    //         return 'translate(' + horz + ',' + vert + ')'
    //     })
    //
    // legend
    //     .append('rect')
    //     .attr('width', legendRectSize)
    //     .attr('height', legendRectSize)
    //     .style('fill', scaleColor)
    //     .style('stroke', scaleColor)
    //
    // legend
    //     .append('text')
    //     .attr('x', legendRectSize + legendSpacing)
    //     .attr('y', legendRectSize - legendSpacing)
    //     .text(function (d) {
    //         console.log(d)
    //         return  d
    //     })

}

/**
 * @method createNodes
 * @param {Object} source
 */
function createNodes(source,vis) {
    let root = d3.hierarchy({ children: source })
        .sum(d => d.value);
    console.log("root",root)
    const rootData = vis.pack(root).leaves().map((d, i) => {
        const data = d.data;
        const color = scaleColor(data.name);
        return {
            x: vis.centerX + (d.x - vis.centerX) * 3,
            y: vis.centerY + (d.y - vis.centerY) * 3,
            id: "bubble" + i,
            r: 0,
            radius: d.r,
            value: data.value,
            name: data.name,
            color: color,
        }
    });

    // sort them to prevent occlusion of smaller nodes.
    rootData.sort((a, b) => b.value - a.value);
    return rootData;
}

function ticked() {
    bubble.attr("transform", d => `translate(${d.x},${d.y})`)
        .select("circle")
        .attr("r", d => d.r);
}

