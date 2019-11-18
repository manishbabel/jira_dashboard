//TODO: DAVID Merge Velocity Chart into VelocityChart2 structure
//TODO:  Use the svg object passed from VelocityChart2 instead of creating another
class VelocityChart2 {
    constructor(data, svg) {
        this._data = data;
        this._svg = svg;
        this._velocityChart = new VelocityChart(this.svg.container.substr(1), this.data);
    }

    get data() {
        return this._data;
    }

    get svg() {
        return this._svg;
    }
}
//references: https://codepen.io/ashokgowtham/pen/LpnHe lab6 https://www.d3-graph-gallery.com/graph/line_cursor.html

let defaultLayer = "storyPoints";


VelocityChart = function(_parentElement, _issueStore){
    this.parentElement = _parentElement;
    this.issueStore = _issueStore;

    this.initVis();
}

VelocityChart.prototype.initVis = function(){
    var vis = this;
    var processingData = true;

    //initialize initial data
    //TODO: filter by selected time band
    vis.displayData = vis.issueStore.getSprints().filter(function (d) {
        //Active or closed sprints only (no future)
        return d.state == "CLOSED" || d.state == "ACTIVE";
    }).sort(function (a, b) {
        return b.endDate - a.endDate;
    });

    //TODO: filter by selected time band
    vis.displayData = vis.displayData.slice(0, Math.min(vis.displayData.length, 10));

    var priorities = [];
    var priorityIds = [];

    //pre-process data
    vis.displayData.forEach(function (sprint) {
        //set the issues of each sprint
        sprint.issues = vis.issueStore.getIssuesForSprint(sprint);

        //get all possible priorities
        sprint.issues.forEach(function (issue) {

            //TODO remove once priority bug is fixed
            if(issue.fields.priority == null) {
                issue.fields.priority = {
                    id:"3",name:"Minor"
                }
            }

            if(! priorityIds[issue.fields.priority.id]) {
                priorities.push(issue.fields.priority.name);
                priorityIds[issue.fields.priority.id] = issue.fields.priority.name;
            }
        })
    });
    vis.priorities = priorities;

    //calculate sum of story points per sprint
    vis.displayData.forEach(function (sprint) {
        priorities.forEach(function (priority) {
           sprint[priority] = 0;
        });
        sprint.issues.forEach(function (issue) {
            sprint[issue.fields.priority.name] += issue.storyPoints;
        });
    });

    //initialize SVG drawing area
    vis.margin = { top: 40, right: 60, bottom: 60, left: 60 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // TO-DO: Overlay with path clipping
    vis.svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height);

    // Scales and axes
    vis.xRange = splitRange([0, vis.width], vis.displayData.length);
    vis.x = d3.scaleOrdinal()
        .range(vis.xRange)
        .domain(vis.displayData.map(function (d) {
            return d.name;
        }));

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    // Initialize stack layout
    vis.colorScale = d3.scaleOrdinal(d3.schemeCategory20);
    vis.colorScale.domain(vis.priorities);
    var stack = d3.stack()
        .keys(vis.colorScale.domain());

    // Stack data
    vis.stackedData = stack(vis.displayData);

    // Stacked area layout
    vis.area = d3.area()
        .curve(d3.curveLinear)
        .x(function(d) {
            return vis.x(d.data.name); })
        .y0(function(d) {
            return vis.y(d[0]); })
        .y1(function(d) {
            return vis.y(d[1]); });


    // TO-DO: Tooltip placeholder
    vis.svg.append("text")
        .attr("class", "layer")
        .attr("id", "layer-name")
        .attr("x", 20)
        .attr("y", 20);

    //tool tip
    vis.tool_tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-8, 0])
        .html(function(d) {
            return "tool tip";
        });
    vis.svg.call(vis.tool_tip);

    // This allows to find the closest X index of the mouse:
    vis.bisect = d3.bisector(function(d) { return d.name; }).left;

    // (Filter, aggregate, modify data)
    vis.wrangleData();
}



/*
 * Data wrangling
 */

VelocityChart.prototype.wrangleData = function(){
    var vis = this;

    // In the first step no data wrangling/filtering needed
    //vis.displayData = vis.issueStore.getSprints();

    // Update the visualization
    vis.updateVis();
}



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

VelocityChart.prototype.updateVis = function(){
    var vis = this;

    // Update domain
    // Get the maximum of the multi-dimensional array or in other words, get the highest peak of the uppermost layer
    vis.y.domain([0, d3.max(vis.stackedData, function(d) {
        return d3.max(d, function(e) {
            return e[1];
        });
    })
    ]);

    var dataCategories = vis.colorScale.domain();

// Draw the layers
    var categories = vis.svg.selectAll(".area")
        .data(vis.stackedData);
        //.data(vis.displayData);

    categories.enter().append("path")
        .attr("class", "area")
        .merge(categories)
        .style("fill", function(d,i) {
            return vis.colorScale(vis.priorities[i]);
            //return vis.colorScale("completedStoryPoints");
        })
        .attr("d", function(d) {
            return vis.area(d);

            // TO-DO: Update tooltip text
        });
    /*.on("mouseover", function(d,i) {
        vis.svg.select("#layer-name").text(d.key);
    });

     */

    categories.exit().remove();
    var dataPoints = {};
    //draw points
    var points = vis.svg.selectAll('.dots')
        .data(vis.stackedData)
        .enter()
        .append("g")
        .attr("class", "dots")
        .attr("d", function(d) { return vis.area(d.values); })
        .attr("clip-path", "url(#clip)");

    points.selectAll('.dot')
        .data(function(d, index){
            var a = [];
            d.forEach(function(point,i){
                a.push({'index': index, 'point': point});
            });
            return a;
        })
        .enter()
        .append('circle')
        .attr('class','dot')
        .attr("r", 1.5)
        .attr('fill', function(d,i){
            return '#000000';
        })
        .attr("transform", function(d) {
            var key = vis.x(d.point.data.name);
            dataPoints[key] = dataPoints[key] || [];
            dataPoints[key].push(d);
            return "translate(" + vis.x(d.point.data.name) + "," + vis.y(d.point[1]) + ")"; }
        );

    //goal: something like http://nvd3.org/examples/stackedArea.html

    // Create the line that travels along the curve of chart
    var vertline = vis.svg
        .append('g')
        .append('line')
        .style("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", "1")
        .style("opacity", 0);

    // Create the text that travels along the curve of chart
    var lineText = vis.svg
        .append('g')
        .append('text')
        .style("opacity", 0)
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "middle");

    // Create a rect on top of the svg area: this rectangle recovers mouse position
    vis.svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', vis.width)
        .attr('height', vis.height)
        .on('mouseover', function () {
            vertline.style("opacity", 1);
            lineText.style("opacity",1);
        })
        .on('mousemove', function() {
            // recover coordinate we need
            var i = findClosestPoint(vis.xRange,d3.mouse(this)[0]);
            vertline
                .attr("x1", vis.x(vis.stackedData[0][i].data.name))
                .attr("y1", vis.y(vis.stackedData[vis.stackedData.length -1][i][1]))
                .attr("x2", vis.x(vis.stackedData[0][i].data.name))
                .attr("y2", vis.height);
            lineText
                .html(vis.stackedData[0][i].data.name)
                .attr("x", vis.x(vis.stackedData[0][i].data.name) -100)
                .attr("y", 0)
                .attr("class", "label value-label");
        })
        .on('mouseout', function(){
            vertline.style("opacity", 0);
            lineText.style("opacity", 0);
        });


    // Call axis functions with the new domain
    vis.svg.select(".x-axis").call(vis.xAxis)
        .selectAll("text")
        .attr("class", "x-axis")
        .attr("y", 25)
        .attr("x", -38)
        .attr("dy", ".35em")
        .attr("transform", "rotate(25)")
        .style("text-anchor", "start");
      //  .selectAll("text")
       // .text(vis.xAxisText);
    vis.svg.select(".y-axis").call(vis.yAxis);

    //Legends for the layers
    var lineLegend = vis.svg.selectAll('g.layerLegend')
        .data(vis.colorScale.domain())
        .enter()
        .append('g').attr('class', 'layerLegend');
    lineLegend
        .append('rect')
        .attr("x", 10)
        .attr("y", function(d, i) {
            return i * 20;
        })
        .attr("width", 10)
        .attr("height", 10)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("fill", function(d){return vis.colorScale(d);});
    //the data objects are the fill colors
    lineLegend
        .append('text')
        .attr("class", "layerLegend")
        .attr("x", 30) //leave 5 pixel space after the <rect>
        .attr("y", function(d, i) {
            return i * 20;
        })
        .attr("dy", "0.8em") //place text one line *below* the x,y point
        .text(function(d,i) {
            var index = vis.priorities.length - i -1;
            return d;
        });
}


//Function that returns discrete values of a range given start, end, and # of values
function splitRange(range, n) {
    if(n <=2 ) return range;
    var increment = (range[1] - range[0])/(n-1);
    return d3.range(0,n).map(function (d) {
        return range[0] + d*increment;
    });
}

function findClosestPoint(range, value) {
    var result;
    var min = 10000000;

    range.forEach(function (d, i) {
        if(Math.abs(d - value) < min) {
            min = Math.abs(d - value);
            result = i;
        }
    });
    return result;

}