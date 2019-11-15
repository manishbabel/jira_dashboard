
const scaleColor = d3.scaleOrdinal(d3.schemeCategory20);
let forceCollide = d3.forceCollide(d => d.r + 1); // create a circle collision force.
var dateFormatter = d3.timeFormat("%Y-%m-%d");
var dateParser = d3.timeParse("%Y-%m-%d");


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
    vis.center = {
        x: vis.width/2,
        y: vis.height/2
    }
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width",  vis.width -  vis.margin.left -  vis.margin.right )
        .attr("height",  vis.height  )
        // .append("g").attr("transform", "translate(" + 0   + "," + ( vis.width  ) + ")");
    ////////// slider //////////

    var moving = false;
    var currentValue = 0;
    var targetValue = vis.width -  vis.margin.left -  vis.margin.right;
    var formatDateIntoYear = d3.timeFormat("%Y");
    var formatDate = d3.timeFormat("%b %Y");
    var parseDate = d3.timeParse("%m/%d/%y");

    var startDate = new Date("2004-11-01"),
        endDate = new Date("2017-04-01");



    vis.playButton = d3.select("#play-button");
    // Scales and axes
    vis.xSliderScale = d3.scaleBand()
        .rangeRound([0, vis.width])
        .paddingInner(0.2)
        // .domain(d3.range(0,15));

    // vis.xSliderScale = d3.scaleLinear()
    //     .range([0, targetValue ])
    //     // .clamp(true);
    vis.slider = vis.svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.height/5 + ")");
    console.log(vis.xSliderScale.range()[1])
    vis.slider.append("line")
        .attr("class", "track")
        .attr("x1", vis.xSliderScale.range()[0])
        .attr("x2", vis.xSliderScale.range()[1])
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { vis.slider.interrupt(); })
            .on("start drag", function() {
                currentValue = d3.event.x;
                // update(x.invert(currentValue));
            })
        );

    var handle = vis.slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);

    // var label = slider.append("text")
    //     .attr("class", "label")
    //     .attr("text-anchor", "middle")
    //     .text(function(d) { return ("Sprint-"+d); })
    //     .attr("transform", "translate(0," + (-25) + ")")

    vis.playButton
        .on("click", function() {
            var button = d3.select(this);
            if (button.text() == "Pause") {
                moving = false;
                clearInterval(timer);
                // timer = 0;
                button.text("Play");
            } else {
                moving = true;
                timer = setInterval(step, 100);
                button.text("Pause");
            }
            // console.log("Slider moving: " + moving);
        })
    function step() {
        update(x.invert(currentValue));
        currentValue = currentValue + (targetValue/151);
        if (currentValue > targetValue) {
            moving = false;
            currentValue = 0;
            clearInterval(timer);
            // timer = 0;
            playButton.text("Play");
            // console.log("Slider moving: " + moving);
        }
    }
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
    startDate = dateFormatter(vis.activeSprint['startDate'])
    endDate = dateFormatter(vis.activeSprint['endDate'])
    console.log(startDate,endDate)
    var daylist = getDaysArray(new Date(startDate),new Date(endDate));
    // daylist.map((v)=>v.toISOString().slice(0,10)).join("")
    console.log(daylist)
    vis.xSliderScale.domain([0,daylist.length])

    console.log("adasda",vis.xSliderScale.bandwidth())
    vis.slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 20 + ")")
        .selectAll("text")
        .data(daylist)
        .enter()
        .append("text")
        .attr("x",  function(d, index){
            return (index*100);
        })
        .attr("y", 5)
        .attr("text-anchor", "middle")
        .text(function(d) { return (d); });

    const nodes = createNodes(vis.storiesForActiveSprint,vis);
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

function ticked() {
    bubble.attr("transform", d => `translate(${d.x},${d.y})`)
        .select("circle")
        .attr("r", d => d.r);
}

var getDaysArray = function(start, end) {
    for(var arr=[],dt=start; dt<=end; dt.setDate(dt.getDate()+1)){
        arr.push(dateFormatter(new Date(dt)));
    }
    console.log(arr)
    return arr;
};