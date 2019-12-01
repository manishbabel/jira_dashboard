//TODO: DAVID Merge Velocity Chart into VelocityChart2 structure
//TODO:  Use the svg object passed from VelocityChart2 instead of creating another

//references: https://wesbos.com/template-strings-html/ https://tntvis.github.io/tnt.tooltip/
// https://codepen.io/ashokgowtham/pen/LpnHe lab6 https://www.d3-graph-gallery.com/graph/line_cursor.html
// https://d3-legend.susielu.com/


class VelocityChart2 {
    constructor(data, svg, eventHandler) {
        this._data = data;
        this._svg = svg;
        this._eventHandler = eventHandler;
        this._velocityChart = new VelocityChart(this.svg.container.substr(1), this.data, eventHandler, this.svg);
    }

    get data() {return this._data;}

    get svg() {return this._svg;}

    get eventHandler() {return this._eventHandler;}

    onSelectedLayerChange(selection) {
        this._velocityChart.onSelectedLayerChange(selection);
    }
    onSelectedMetricChange(selection) {
        this._velocityChart.onSelectedMetricChange(selection);
    }

}



//constants
//const defaultLayer = "storyPoints";
const maxSprints = 10;

//count metrics
const totalStoryPoints = "totalSprintStoryPoints";
const completedStoryPoints = "completedSprintStoryPoints";
const issueCount = "issueSprintCount";

//layers
const priorityLayer = "priority";
const issueTypeLayer = "issueType";
const componentLayer = "components";



VelocityChart = function(_parentElement, _issueStore, _eventHandler, svgObj){
    this.parentElement = _parentElement;
    this.issueStore = _issueStore;
    this.eventHandler = _eventHandler;
    this.svg = svgObj.svg;
    this.margin = svgObj.margin;
    this.height = svgObj.height;
    this.width = svgObj.width;
    this.initVis();
};

VelocityChart.prototype.initVis = function(){
    const vis = this;
    //let processingData = true;

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


    let priorities = [];
    let priorityIds = [];
    let issueTypeIds = [];
    let issueTypes = [];
    let componentIds = [];
    let components = ["None"];

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
            sprint[issueCount][priorityLayer][issue.fields.priority.name] += 1;
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

    //set default layer
    vis.layer = vis.priorities;
    vis.currentLayer = priorityLayer;
    vis.currentMetric = totalStoryPoints;

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

    vis.svg.append("g")
        .attr("class", "visLegend");


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
        .scale(vis.x)
        .tickFormat("");

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    vis.svg
        .append("g")
        .append("text")
        .attr("class", "legend yLegend velocityMetric")
        .attr("y", 0 - vis.margin.top/2 - 20)
        .attr("x", 0 - vis.margin.left/2 -35)
        .attr("transform", "rotate(-90)")
        .text(function () {
            return velocitySelect.find(function (d) {
                return d.value == d3.select("#velocitySelect").property("value");
            }).displayName;
        });

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

    //add triggers
    d3.select("#velocitySelect").on("change", function () {
        $(vis.eventHandler).trigger("selectedMetricChange", d3.select("#velocitySelect").property("value"));
    });
    d3.select("#velocityLayersSelect").on("change", function () {
        $(vis.eventHandler).trigger("selectedLayerChange", d3.select("#velocityLayersSelect").property("value"));
    });

    // Initialize stack layout
    vis.colorScale = d3.scaleOrdinal();
    vis.colorScale.domain(vis.layer);

    // (Filter, aggregate, modify data)
    vis.wrangleData();
};

/*
 * Data wrangling
 */

VelocityChart.prototype.wrangleData = function(){
    const vis = this;
    vis.colorScale.range(d3.schemeCategory20.filter(function (d,i) {
        //needed as the legend needs the domain and range lengths to match
        return i < vis.layer.length;
    }));
    vis.colorScale.domain(vis.layer);

    const stack = d3.stack()
        .keys(vis.colorScale.domain())
        .value(function (d,key) {
            //console.log(d);
            //console.log(d[vis.currentMetric][vis.currentLayer])
            return d[vis.currentMetric][vis.currentLayer][key];
        });

    // Stack data
    vis.stackedData = stack(vis.displayData);

    // Stacked area layout
    vis.area = d3.area()
        .curve(d3.curveLinear)
        .x(d => vis.x(d.data.name))
        .y0(d => vis.y(d[0]))
        .y1(d => vis.y(d[1]));

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

    //const dataCategories = vis.colorScale.domain();

// Draw the layers
    const categories = vis.svg.selectAll(".area")
        .data(vis.stackedData);
    //.data(vis.displayData);

    categories.exit().remove();

    categories.enter().append("path")
        .attr("class", "area")
        .merge(categories)
        .transition(1000)
        .style("fill", function(d,i) {
            return vis.colorScale(vis.layer[i]);
        })
        .attr("d", function(d) {
            return vis.area(d);
        });

    categories.exit().remove();

    //goal: something like http://nvd3.org/examples/stackedArea.html

    // Create the line that travels along the curve of chart
    const vertline = vis.svg
        .append('g')
        .append('line')
        .style("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", "1")
        .style("opacity", 0);

    const custom_tooltip = function(d) {
        let obj = {};
        obj.header = d.vis.stackedData[0][d.i].data.name;
        obj.rows = [];
        d.vis.layer.forEach(function (layer, i) {
            const val = d.vis.stackedData[i][d.i][1] - d.vis.stackedData[i][d.i][0];
            if (val > 0)
            obj.rows.push({"label":layer, "value":d.vis.stackedData[i][d.i][1] - d.vis.stackedData[i][d.i][0]});
        });

        tooltip.table()
            .width(200)
            .call (this, obj);
    };

    // Create a rect on top of the svg area: this rectangle recovers mouse position
    vis.svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', vis.width)
        .attr('height', vis.height)
        .on('mouseover', function () {
            vertline.style("opacity", 1);
        })
        .on('mousemove', function(d) {
            // recover coordinate we need
            const i = findClosestPoint(vis.xRange,d3.mouse(this)[0]);
            vertline
                .attr("x1", vis.x(vis.stackedData[0][i].data.name))
                .attr("y1", vis.y(vis.stackedData[vis.stackedData.length -1][i][1]))
                .attr("x2", vis.x(vis.stackedData[0][i].data.name))
                .attr("y2", vis.height);

            custom_tooltip.call(this, {"vis":vis, "i":i});
        })
        .on('mouseout', function(){
            vertline.style("opacity", 0);
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
            let curSprint = "Sprint " + (i + vis.startingSprint + 1);
            if(d == vis.activeSprint.name) curSprint += "(Active)";
            return curSprint;
        });

    vis.svg.select(".y-axis").call(vis.yAxis);

    //color legend
    //const legendOffset = vis.margin.left + vis.width - 32 * vis.layer.length;

    const legend = d3.legendColor()
        .shapeWidth(30)
        .orient("verticle")
        .scale(vis.colorScale)
        .cells(vis.layer.length)
        //.shapePadding(40)
        ;

    d3.select(".visLegend").attr("transform", "translate("+ -vis.margin.left +"-35)");

    vis.svg.select(".visLegend")
        .call(legend);
};

VelocityChart.prototype.onSelectedLayerChange = function(selection) {
    const vis = this;

    switch(selection) {
        case "priorities":
            vis.layer = vis.priorities;
            vis.currentLayer = priorityLayer;
            break;
        case "components":
            vis.layer = vis.components;
            vis.currentLayer = componentLayer;
            break;
        case "issueType":
            vis.layer = vis.issueTypes;
            vis.currentLayer = issueTypeLayer;
            break;
    }

    vis.wrangleData();

};

VelocityChart.prototype.onSelectedMetricChange = function(selection){
    const vis = this;
    switch(selection) {
        case "totalStoryPoints":
            vis.currentMetric = totalStoryPoints;
            break;
        case "completedStoryPoints":
            vis.currentMetric = completedStoryPoints;
            break;
        case "issueCount":
            vis.currentMetric = issueCount;
            break;
    }
    d3.select(".velocityMetric")
        .text(function () {
            return velocitySelect.find(function (d) {
                return d.value == selection;
            }).displayName;
        });
    vis.wrangleData();
};


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
    {value: "issueType", displayName: "Issue Type"}
];

const velocityHtml = `
<div class="container">
    <div class="row">
    <div class="col-md-2">
            <select class="select" id="velocityLayersSelect">
                ${breakdownOptions.map(function (option) {
    return `<option value=${option.value} ${option.selected ? "selected" : ""}>${option.displayName}</option>`
}).join('')}
            </select>
</div>
        <div class="col-md-2">
            <select class="select" id="velocitySelect">
                ${velocitySelect.map(function (option) {
    return `<option value=${option.value} ${option.selected ? "selected" : ""}>${option.displayName}</option>`
}).join('')}
            </select>
        </div>
        <div class="col-md-8"></div>
        
    </div>
    <div class="row">
        <div class="col-md-12" id="vis-velocity-chart"></div>
    </div>
</div>
</div>
`;