//TODO: KEVIN Merge LineChart into RetroChart structure
//TODO:  Use the svg object passed from RetroChart instead of creating another
//TODO:  Use the retroStore Object instead of creating another

class RetroChart {
    constructor(data, svg) {
        this._data = data;
        this._svg = svg;
        this._lineChart = new LineChart(this.svg.container.substr(1), data);
    }

    get data(){return this._data;}
    get svg(){return this._svg;}
}

//TODO Kevin cut and paste your latest from here down.  You can please leave RetroChart.
/*
 * LineChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

LineChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.filteredData = this.data;

    this.initVis();
};


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

LineChart.prototype.initVis = function(){
    var vis = this;

    // SVG margin convention
    vis.margin = { top: 60, right: 240, bottom: 60, left: 60 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    vis.x = d3.scaleLinear()
        .domain([0, vis.filteredData.length])
        .range([0, vis.width]);

    vis.y = d3.scaleLinear()
        .domain([-5,5])
        .range([vis.height,0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create axes
    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(vis.xAxis);

    vis.svg.append("g")
        .attr("class", "y-axis axis")
        .call(vis.yAxis);

    // Axis labels
    vis.svg.append("text")
        .attr("class", "label")
        .attr("x", -50)
        .attr("y", -20)
        .text("Rating");

    vis.svg.append("text")
        .attr("class", "label")
        .attr("y", vis.height+40)
        .attr("x", vis.width)
        .text("Sprint");

    // Tool tip
    vis.svg.append("text")
        .attr("id", "sprint-tool")
        .attr("class", "tip")
        .attr("x", 20)
        .attr("y", -40)
        .style("display", "none");

    vis.svg.append("text")
        .attr("class", "tip")
        .attr("id", "score-tool")
        .attr("x", 20)
        .attr("y", -20)
        .style("display", "none");

    // Legend
    vis.legend = vis.svg.append("g")
        .attr("class", "legend");

    vis.metrics = ["Communication", "Fun", "Goals", "Organization", "Resources", "Support"];

    vis.color.domain(d3.keys(vis.metrics));

    vis.lines = vis.metrics.map(function(d,i){
        return d3.line()
            .x(function(e,j){ return vis.x(j); })
            .y(function(e,j){
                var tot = e[d].reduce(function(a,b){ return a+b; });
                return vis.y(tot/e[d].length);
            })
            .curve(d3.curveMonotoneX);
    });

    // Create path, circles, and legend for each metric
    for (var i = 0; i < vis.metrics.length; i++){

        vis.svg.append("path")
            .attr("class", "line " + vis.metrics[i])
            .datum(vis.filteredData)
            .attr("stroke-width", 3)
            .attr("fill", "none")
            .attr("stroke", vis.color(i))
            .attr("d", vis.lines[i])
            .on("mouseover", function(d){
                var cat = d3.select(this).attr("class").split(" ")[1];
                $(".line").not("." + cat).attr("opacity", 0.2);
                $(".dots").not("." + cat).attr("opacity", 0.2);
            })
            .on("mouseout", function(d){
                $(".line").attr("opacity", 1);
                $(".dots").attr("opacity", 1);
            });

        vis.svg.selectAll(".dots " + vis.metrics[i])
            .data(vis.filteredData).enter()
            .append("circle")
            .attr("class", "dots " + vis.metrics[i])
            .attr("cx", function(d,j){ return vis.x(j); })
            .attr("cy", function(d,j){
                var tot = d[vis.metrics[i]].reduce(function(a,b){ return a+b; });
                return vis.y(tot/d[vis.metrics[i]].length)
            })
            .attr("r", 5)
            .attr("fill", vis.color(i))
            .on("mouseover", function(d,i){
                d3.select(this).attr("r", 8)

                var cat = d3.select(this).attr("class").split(" ")[1];

                $(".line").not("." + cat).attr("opacity", 0.2);
                $(".dots").not("." + cat).attr("opacity", 0.2);

                var val = vis.y.invert(d3.select(this).attr("cy")).toFixed(2);
                $("#sprint-tool").show().html("Sprint " + (i+1));
                $("#score-tool").show().html(cat + ": " + val);
            })
            .on("mouseout", function(d,i){
                d3.select(this).attr("r", 5)

                $("#sprint-tool").hide();
                $("#score-tool").hide();

                $(".line").attr("opacity", 1);
                $(".dots").attr("opacity", 1);
            });

        vis.legend.append("rect")
            .attr("x", vis.width+50)
            .attr("y", vis.height/3 + i*30)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", vis.color(i));

        vis.legend.append("text")
            .attr("x", vis.width+80)
            .attr("y", vis.height/3 + i*30 + 15)
            .text(vis.metrics[i])
    }

    // (Filter, aggregate, modify data)
    //vis.wrangleData();
};


/*
 * Data wrangling
 */

LineChart.prototype.wrangleData = function(){
    var vis = this;

    //var votesPerPriority = [];

    // Create a sequence from 0 - 14 (priorities: 1-15; array length: 15), initialize values to 0
    var votesPerPriority = d3.range(0,15).map(function(){ return 0; });

    // Aggregate over priorities, iterate over all data
    vis.filteredData.forEach(function(d){
        d.priorities.forEach(function(e,j){
            votesPerPriority[j] += e;
        })
    });

    vis.displayData = votesPerPriority;

    // Update the visualization
    vis.updateVis();
};


/*
 * The drawing function
 */

LineChart.prototype.updateVis = function(){
    var vis = this;

    // Update domains
    vis.y.domain([0, d3.max(vis.displayData)]);

    var bars = vis.svg.selectAll(".bar")
        .data(this.displayData);

    bars.enter().append("rect")
        .attr("class", "bar")

        .merge(bars)
        .transition()
        .attr("width", vis.x.bandwidth())
        .attr("height", function(d){
            return vis.height - vis.y(d);
        })
        .attr("x", function(d, index){
            return vis.x(index);
        })
        .attr("y", function(d){
            return vis.y(d);
        });

    bars.exit().remove();

    // Call axis function with the new domain
    vis.svg.select(".y-axis").call(vis.yAxis);

    // Adjust axis labels
    vis.svg.select(".x-axis").call(vis.xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d) {
            return "rotate(-45)"
        })
        .text(function(d){
            return vis.metaData.priorities[d]["item-title"]
        })

    //console.log(vis.metaData);
};


LineChart.prototype.onSelectionChange = function(selectionStart, selectionEnd){
    var vis = this;

    // Filter original unfiltered data depending on selected time period (brush)
    vis.filteredData = vis.data.filter(function(d){
        return d.time >= selectionStart && d.time <= selectionEnd;
    });

    vis.wrangleData();
};
