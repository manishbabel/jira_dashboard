let defaultLayer = "storyPoints";


VelocityChart = function(_parentElement, _issueStore){
    this.parentElement = _parentElement;
    this.issueStore = _issueStore;

    this.initVis();
}

VelocityChart.prototype.initVis = function(){
    var vis = this;
    var processingData = true;

    splitRange([0,200], 5);

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
    vis.x = d3.scaleOrdinal()
        .range(splitRange([0, vis.width], vis.displayData.length))
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
    var finalRange = [];
    var increment = (range[1] - range[0])/(n-1);
    finalRange.push(range[0]);

    for(var i = 1; i < n-1; i++) {
        finalRange.push(finalRange[i-1] + increment);
    }
    finalRange.push(range[1]);

    return finalRange;

}