//TODO: DAVID Merge Velocity Chart into VelocityChart2 structure
//TODO:  Use the svg object passed from VelocityChart2 instead of creating another



class VelocityChart2 {
    constructor(data, svg, eventHandler) {
        this._data = data;
        this._svg = svg;
        // this._velocityChart =
        //     new VelocityChart(this.svg.container.substr(1), this.data);
        this._eventHandler = eventHandler;
        this._velocityChart = new VelocityChart(this.svg.container.substr(1), this.data, eventHandler);
    }

    get data() {return this._data;}
    get svg() {return this._svg;}

    get eventHandler() {return this._eventHandler;}
}
//references: https://codepen.io/ashokgowtham/pen/LpnHe lab6 https://www.d3-graph-gallery.com/graph/line_cursor.html
//references: https://wesbos.com/template-strings-html/
//https://tntvis.github.io/tnt.tooltip/


//constants
const defaultLayer = "storyPoints";
const maxSprints = 10;

//count metrics
const totalStoryPoints = "totalSprintStoryPoints";
const completedStoryPoints = "completedSprintStoryPoints";
const issueCount = "issueSprintCount";

//layers
const priorityLayer = "priority";
const issueTypeLayer = "issueType";
const componentLayer = "components";



VelocityChart = function(_parentElement, _issueStore, _eventHandler){
    this.parentElement = _parentElement;
    this.issueStore = _issueStore;
    this.eventHandler = _eventHandler;

    this.initVis();
}

VelocityChart.prototype.initVis = function(){
    const vis = this;

    //inject template html
    document.getElementById(vis.parentElement).innerHTML = velocityHtml;

    //initialize initial data
    //TODO: filter by selected time band
    vis.displayData = vis.issueStore.getSprints().filter(function (d) {
        //Active or closed sprints only (no future)
        return d.state == "CLOSED" || d.state == "ACTIVE";
    }).sort(function (a, b) {
        return a.endDate - b.endDate;
    });

    //TODO: filter by selected time band
    vis.startingSprint = Math.max(0, vis.displayData.length - maxSprints);
    vis.displayData = vis.displayData.slice(vis.startingSprint , vis.displayData.length);


    const priorities = [];
    const priorityIds = [];
    var issueTypeIds = [];
    var issueTypes = [];
    console.log(vis.displayData);
    var componentIds = [];
    var components = ["None"];

    //pre-process data
    vis.displayData.forEach(function (sprint) {
        //set the issues of each sprint
        sprint.issues = vis.issueStore.getIssuesForSprint(sprint);

        //get all possible priorities
        sprint.issues.forEach(function (issue) {
            if(! priorityIds[issue.fields.priority.id]) {
                priorities.push(issue.fields.priority.name);
                priorityIds[issue.fields.priority.id] = issue.fields.priority.name;
            }
            if(! issueTypeIds[issue.fields.issuetype.id]) {
                issueTypes.push(issue.fields.issuetype.name);
                issueTypeIds[issue.fields.issuetype.id] = issue.fields.issuetype.name;
            }

            issue.fields.components.forEach(function (component) {
                if(! componentIds[component.id]) {
                    components.push(component.name);
                    componentIds[component.id] = component.name;
                }
            });
        })
    });
    vis.priorities = priorities;
    vis.issueTypes = issueTypes;
    vis.components = components;

    //calculate sum of story points per sprint
    vis.displayData.forEach(function (sprint) {

        sprint[totalStoryPoints] = {};
        sprint[totalStoryPoints][priorityLayer] = {};
        sprint[totalStoryPoints][componentLayer] = {};
        sprint[totalStoryPoints][issueTypeLayer] = {};
        sprint[issueCount] = {};
        sprint[issueCount][priorityLayer] = {};
        sprint[issueCount][componentLayer] = {};
        sprint[issueCount][issueTypeLayer] = {};
        sprint[completedStoryPoints] = {};
        sprint[completedStoryPoints][priorityLayer] = {};
        sprint[completedStoryPoints][componentLayer] = {};
        sprint[completedStoryPoints][issueTypeLayer] = {};

        priorities.forEach(function (priority) {

           sprint[priority] = 0; //TODO remove this
            sprint[totalStoryPoints][priorityLayer][priority] = 0;
            sprint[completedStoryPoints][priorityLayer][priority] = 0;
            sprint[issueCount][priorityLayer][priority] = 0;
        });
        issueTypes.forEach(function (issueType) {
            sprint[totalStoryPoints][issueTypeLayer] [issueType] = 0;
            sprint[completedStoryPoints][issueTypeLayer] [issueType] = 0;
            sprint[issueCount][issueTypeLayer][issueType] = 0;
        });

        components.forEach(function (component) {
            sprint[totalStoryPoints][componentLayer][component] = 0;
            sprint[completedStoryPoints][componentLayer][component] = 0;
            sprint[issueCount][componentLayer][component] = 0;
        });
        sprint.issues.forEach(function (issue) {
            sprint[issue.fields.priority.name] += issue.storyPoints; //TODO remove
            //Total Story Points
            sprint[totalStoryPoints][priorityLayer][issue.fields.priority.name] += issue.storyPoints;
            sprint[totalStoryPoints][issueTypeLayer][issue.fields.issuetype.name] += issue.storyPoints;

            //Completed Story Points
            if(issue.isResolved) {
                sprint[completedStoryPoints][priorityLayer][issue.fields.priority.name] += issue.storyPoints;
                sprint[completedStoryPoints][issueTypeLayer][issue.fields.issuetype.name] += issue.storyPoints;
            }

            //Issue Count
            sprint[issueCount][priorityLayer][issue.fields.priority.name] += 1
            sprint[issueCount][issueTypeLayer][issue.fields.issuetype.name] += 1;

            //Components
            if(issue.fields.components.length == 0) {
                sprint[totalStoryPoints][componentLayer]["None"] += issue.storyPoints;
                if(issue.isResolved) sprint[completedStoryPoints][componentLayer]["None"] += issue.storyPoints;
                sprint[issueCount][componentLayer]["None"] += 1;
            } else {
                issue.fields.components.forEach(function (component) {
                    sprint[totalStoryPoints][componentLayer][component.name] += issue.storyPoints;
                    if(issue.isResolved) sprint[completedStoryPoints][componentLayer][component.name] += issue.storyPoints;
                    sprint[issueCount][componentLayer][component.name] += 1;
                })
            }
        });
        if(sprint.state == "ACTIVE") vis.activeSprint = sprint;
    });
    console.log(vis.displayData);

    //initialize SVG drawing area
    vis.margin = { top: 40, right: 65, bottom: 60, left: 60 };

    vis.width = $("#vis-velocity-chart").width() - vis.margin.left - vis.margin.right,
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#vis-velocity-chart").append("svg")
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
        .domain(vis.displayData.map(d => d.name));

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x)
        .tickFormat("");

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
    const stack = d3.stack()
        .keys(vis.colorScale.domain());

    // Stack data
    vis.stackedData = stack(vis.displayData);

    // Stacked area layout
    vis.area = d3.area()
        .curve(d3.curveLinear)
        .x(d => vis.x(d.data.name))
        .y0(d => vis.y(d[0]))
        .y1(d => vis.y(d[1]));

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
        .html(() => "tool tip");
    vis.svg.call(vis.tool_tip);

    // This allows to find the closest X index of the mouse:
    vis.bisect = d3.bisector(d => d.name ).left;




    // (Filter, aggregate, modify data)
    vis.wrangleData();
};

/*
 * Data wrangling
 */

VelocityChart.prototype.wrangleData = function(){
    const vis = this;

    // In the first step no data wrangling/filtering needed
    //vis.displayData = vis.issueStore.getSprints();

    // Update the visualization
    vis.updateVis();
};



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

VelocityChart.prototype.updateVis = function(){
    const vis = this;

    // Update domain
    // Get the maximum of the multi-dimensional array or in other words, get the highest peak of the uppermost layer
    vis.y.domain([0, d3.max(vis.stackedData, d => d3.max(d, e => e[1]))]);

    const dataCategories = vis.colorScale.domain();

// Draw the layers
    const categories = vis.svg.selectAll(".area")
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

            //TODO: Update tooltip text
        });
    /*.on("mouseover", function(d,i) {
        vis.svg.select("#layer-name").text(d.key);
    });

     */

    categories.exit().remove();
    const dataPoints = {};
    //draw points
    const points = vis.svg.selectAll('.dots')
        .data(vis.stackedData)
        .enter()
        .append("g")
        .attr("class", "dots")
        .attr("d", d => vis.area(d.values))
        .attr("clip-path", "url(#clip)");

    points.selectAll('.dot')
        .data(function(d){
            const a = [];
            d.forEach(function(point,index){
                a.push({'index': index, 'point': point});
            });
            return a;
        })
        .enter()
        .append('circle')
        .attr('class','dot')
        .attr("r", 1.5)
        .attr('fill','#000000')
        .attr("transform", function(d) {
            const key = vis.x(d.point.data.name);
            dataPoints[key] = dataPoints[key] || [];
            dataPoints[key].push(d);
            return "translate(" + vis.x(d.point.data.name) + "," + vis.y(d.point[1]) + ")"; }
        );

    //goal: something like http://nvd3.org/examples/stackedArea.html

    // Create the line that travels along the curve of chart
    const vertline = vis.svg
        .append('g')
        .append('line')
        .style("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", "1")
        .style("opacity", 0);

    // Create the text that travels along the curve of chart
    const lineText = vis.svg
        .append('g')
        .append('text')
        .style("opacity", 0)
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "middle");
    var custom_tooltip = tnt.tooltip()
        .width(180)
        .fill (function (d) {
            // The DOM element is passed as "this"
            var container = d3.select(this);

            var table = container
                .append("table")
                .attr("class", "tnt_zmenu")
                .attr("border", "solid")
                .style("width", custom_tooltip.width() + "px");


                table
                    .append("tr")
                    .attr("class", "tnt_zmenu_header")
                    .append("th")
                    .text(d.stackedData[0][d.i].data.name);

            //Legends for the layers
            var tableLegend = table.selectAll(".tnt_zmenu_row")
                .data(d.vis.colorScale.domain())
                .enter();
            var tableRow = tableLegend
                .append("tr")
                .attr("class", "tnt_zmenu_row");
            var tableColHeader = tableRow
                .append("td")
                .style("text-align", "left");
            tableColHeader
                .append('rect')
                .attr("x", 10)
                .attr("y", (d, i) => i * 20)
                .attr("width", 10)
                .attr("height", 10)
                .style("stroke", "black")
                .style("stroke-width", 1)
                .style("fill", e => d.vis.colorScale(e));
            //the data objects are the fill colors
            tableColHeader
                .append('text')
                .attr("class", "layerLegend")
                .attr("x", 30) //leave 5 pixel space after the <rect>
                .attr("y", function(d, i) {
                    return i * 20;
                })
                .attr("dy", "0.8em") //place text one line *below* the x,y point
                .text(function(e,i) {
                    var index = d.priorities.length - i -1;
                    return e;
                });
            tableRow
                .append("td")
                .style("text-align", "right")
                .html(function (e,i) {

                    return d.stackedData[i][d.i][1] - d.stackedData[i][d.i][0];
                    //d.stackedData[i][d.i].data.name
                });
        });


    // Create a rect on top of the svg area: this rectangle recovers mouse position
    vis.svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', vis.width)
        .attr('height', vis.height)
        .on('mouseover', function () {
            vertline.style("opacity", 1);
            //lineText.style("opacity",1);
        })
        .on('mousemove', function(d) {
            // recover coordinate we need
            const i = findClosestPoint(vis.xRange,d3.mouse(this)[0]);
            vertline
                .attr("x1", vis.x(vis.stackedData[0][i].data.name))
                .attr("y1", vis.y(vis.stackedData[vis.stackedData.length -1][i][1]))
                .attr("x2", vis.x(vis.stackedData[0][i].data.name))
                .attr("y2", vis.height);

            custom_tooltip.call(this, { "stackedData":vis.stackedData,
                "i": i, "colorScale": vis.colorScale, "priorities": vis.priorities,
            "vis": vis});
        })
        .on('mouseout', function(){
            vertline.style("opacity", 0);
            //lineText.style("opacity", 0);
        });

    // Call axis functions with the new domain

    vis.svg.select(".x-axis").call(vis.xAxis)

        .selectAll("text")
        .attr("class", "x-axis")
         .attr("y", 25)
        .attr("x", -20)
        .attr("dy", ".35em")
        //.attr("transform", "rotate(25)")
        .style("text-anchor", "start")
        .text(function (d, i) {
            var curSprint = "Sprint " + (i + vis.startingSprint);
            if(d == vis.activeSprint.name) curSprint += "(Active)";
            return curSprint;
    });



    vis.svg.select(".y-axis").call(vis.yAxis);

    //Legends for the layers
    const lineLegend = vis.svg.selectAll('g.layerLegend')
        .data(vis.colorScale.domain())
        .enter()
        .append('g').attr('class', 'layerLegend');
    lineLegend
        .append('rect')
        .attr("x", 10)
        .attr("y", (d, i) => i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("fill", d => vis.colorScale(d));
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
            const index = vis.priorities.length - i -1;
            return d;
        });
};

VelocityChart.prototype.onSelectedLayerChange = function(event) {
    console.log("Selected layer changed: " + event);
}

VelocityChart.prototype.onSelectedMetricChange = function(event){
    console.log("Selected metric changed: " + event);
}


//Function that returns discrete values of a range given start, end, and # of values
function splitRange(range, n) {
    if(n <=2 ) return range;
    const increment = (range[1] - range[0])/(n-1);
    return d3.range(0,n).map(function (d) {
        return range[0] + d*increment;
    });
}

function findClosestPoint(range, value) {
    let result;
    let min = 10000000;

    range.forEach(function (d, i) {
        if(Math.abs(d - value) < min) {
            min = Math.abs(d - value);
            result = i;
        }
    });
    return result;

}

const velocitySelect = [
    {value: "totalStoryPoints", displayName: "Total Story Points", selected:true},
    {value: "completedStoryPoints", displayName: "Completed Story Points"},
    {value: "issueCount", displayName: "Issue Count"}
];

const breakdownOptions = [
    {value: "priorities", displayName: "Priorities", selected:true},
    {value: "components", displayName: "Components"},
    {value: "issueType", displayName: "Issue Type"},
    {value: "epic", displayName: "Epic"}
];

const velocityHtml = `
<div class="container">
    <div class="row">
        <div class="col-md-2">
            <select class="select" id="velocitySelect" onchange="myFunction()">
                ${velocitySelect.map(function (option) {
                    return `<option value=${option.value} ${option.selected ? "selected" : ""}>${option.displayName}</option>`
                }).join('')}
            </select>
        </div>
        <div class="col-md-8"></div>
        <div class="col-md-2">
            <select class="select" id="velocityLayersSelect">
                ${breakdownOptions.map(function (option) {
                     return `<option value=${option.value} ${option.selected ? "selected" : ""}>${option.displayName}</option>`
                    }).join('')}
            </select>
</div>
    </div>
    <div class="row">
        <div class="col-md-12" id="vis-velocity-chart"></div>
    </div>
</div>
</div>
`;