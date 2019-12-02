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
    vis.margin = { top: 70, right: 60, bottom: 50, left: 60 };

    vis.width = 600 - vis.margin.left - vis.margin.right,
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

    // Clip paths
    d3.select("#" + vis.parentElement)
        .append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height)
        .attr("x", 0)
        .attr("y", 0);

    // Categories
    vis.metrics = d3.keys(vis.data[0]);

    // Split data
    vis.splitData = [];

    vis.metrics.forEach(function(d){
        var subset = vis.data.map(function(e){
            return e[d];
        });
        var obj = {};
        obj[d] = subset;
        vis.splitData.push(obj);
    });

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement)
        .selectAll(".smallChart")
        .data(vis.splitData).enter()
        .append("svg")
        .attr("class", function(d){ return "smallChart " + d3.keys(d)[0]; })
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.svg.append('g')
        .attr("clip-path", "url(#clip)");

    // Scales and axes
    vis.x = d3.scaleLinear()
        .domain([0, vis.filteredData.length])
        .range([0, vis.width]);

    vis.y = d3.scaleLinear()
        .domain([-5,5])
        .range([vis.height,0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x)
        .tickFormat(function(d) { return d + 1; });

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create axes
    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(vis.xAxis);

    vis.svg.selectAll(".x-axis").select("path")
        .attr("transform", "translate(0," + (-vis.height/2) +  ")");

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

    vis.color.domain(vis.metrics);

    vis.line = d3.line()
        .x(function(d,i){ return vis.x(i); })
        .y(function(d,i){
            var tot = d.reduce(function(a,b){ return a+b; });
            return vis.y(tot/d.length);
        })
        .curve(d3.curveMonotoneX);

    vis.svg.selectAll(".dotG")
        .data(function(d){
            var cat = d3.keys(d)[0];
            return d[cat];
        })
        .enter()
        .append("g")
        .attr("class", function(d){
            var cat = d3.select(this.parentNode.parentNode).attr("class").split(" ")[1];
            var tot = d.reduce(function(a,b){ return a+b; });
            return "dotG " + cat + " " + tot/d.length;
        })
        .attr("transform", function(d,i){
            return "translate(" + vis.x(i) + ",0)";
        })
        .style("display", "none")
        .selectAll(".dots")
        .data(function(d){
            return d;
        })
        .enter()
        .append("circle")
        .attr("class", function(d){
            var cat = d3.select(this.parentNode.parentNode.parentNode).attr("class").split(" ")[1];
            return "spots " + cat;
        })
        .attr("cy", function(d){
            var mean = d3.select(this.parentNode).attr("class").split(" ")[2];
            return vis.y(mean); })
        .attr("r", 5)
        .attr("fill", function(d,i){ return vis.color(d3.select(this).attr("class").split(" ")[1]); })
        .on("click", unsplit);

    // Create path, circles, and legend for each metric
    vis.svg.append("path")
        .datum(function(d){
            var cat = d3.keys(d)[0];
            return d[cat]
        })
        .attr("class", function(d){
            var cat = d3.select(this.parentNode.parentNode).attr("class").split(" ")[1];
            return "lines " + cat;
        })
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .attr("stroke", function(d,i){ return vis.color(d3.select(this).attr("class").split(" ")[1]); })
        .attr("d", vis.line);

    vis.svg.selectAll(".dots")
        .data(function(d){
            var cat = d3.keys(d)[0];
            return d[cat];
        })
        .enter()
        .append("circle")
        .attr("class", function(d){
            var cat = d3.select(this.parentNode.parentNode).attr("class").split(" ")[1];
            return "dots " + cat;
        })
        .attr("cx", function(d,i){ return vis.x(i); })
        .attr("cy", function(d,j){
            var tot = d.reduce(function(a,b){ return a+b; });
            return vis.y(tot/d.length)
        })
        .attr("r", 5)
        .attr("fill", function(d,i){ return vis.color(d3.select(this).attr("class").split(" ")[1]); })
        .on("mouseover", function(d,i){
            //d3.select(this).attr("r", 8);
        })
        .on("mouseout", function(d,i){
            d3.select(this).attr("r", 5);

            $("#sprint-tool").hide();
            $("#score-tool").hide();

            $(".line").attr("opacity", 1);
            $(".dots").attr("opacity", 1);
        })
        .on("click", split);

    vis.svg
        .append("rect")
        .attr("class", function(d){ return "rectangle " + d3.keys(d)[0]; })
        .attr("width", vis.width)
        .attr("height", vis.height)
        .attr("x", 0)
        .attr("y", 0)
        .attr("opacity", 0)
        .on("mouseover", split)
        .on("mouseout", unsplit);

    // Update functions
    function split(){
        var cat = d3.select(this).attr("class").split(" ")[1];
        $(".fit." + cat).show();
        d3.select(".fit." + cat)
            .transition()
            .duration(1000)
            .attr("x2", function(data){ return vis.x(data[1]); })
            .attr("y2", function(data){ return vis.y(data[3]); });
        $(".title." + cat).text(cat + " - Individual Rating");
        $(".dotG." + cat).show();
        d3.selectAll(".spots." + cat)
            .transition()
            .duration(1000)
            .attr("cy", function(d){ return vis.y(d); });
        $(".lines." + cat).hide();
        $(".dots." + cat).hide();
    }

    function unsplit(){
        var cat = d3.select(this).attr("class").split(" ")[1];
        d3.select(".fit." + cat)
            .transition()
            .duration(1000)
            .attr("x2", function(data){ return vis.x(data[0]); })
            .attr("y2", function(data){ return vis.y(data[2]); });
        $(".fit." + cat).delay(1000).hide(0);
        $(".title." + cat).text(cat + " - Average Rating");
        d3.selectAll(".spots." + cat)
            .transition()
            .duration(1000)
            .attr("cy", function(d){
                var mean = d3.select(this.parentNode).attr("class").split(" ")[2];
                return vis.y(mean);
            });
        $(".lines." + cat).delay(1000).show(0);
        $(".dots." + cat).delay(1000).show(0);
        $(".dotG." + cat).delay(1000).hide(0);

    }

    vis.svg
        .append("text")
        .attr("class", function(d){
            return "title " + d3.keys(d)[0];
        })
        .attr("text-anchor", "start")
        .attr("y", -vis.margin.top/2)
        .attr("x", 0)
        .text(function(d){ return d3.keys(d)[0] + " - Average Rating"; })
        .style("fill", function(d){ return vis.color(d3.keys(d)[0]) });

    vis.svg.append("line")
        .attr("class", function(d){
            return "fit " + d3.keys(d)[0];
        })
        .datum(function(d){
            return vis.regress(d[d3.keys(d)[0]]);
        })
        .attr("x1", function(data){ return vis.x(data[0])})
        .attr("x2", function(data){ return vis.x(data[0])})
        .attr("y1", function(data){ return vis.y(data[2]); })
        .attr("y2", function(data){ return vis.y(data[2]); })
        .style("display", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 3);

    // (Filter, aggregate, modify data)
    vis.wrangleData();
};


/*
 * Data wrangling
 */

LineChart.prototype.wrangleData = function(){
    var vis = this;

    // Update the visualization
    vis.updateVis();
};


/*
 * The drawing function
 */

LineChart.prototype.updateVis = function(){
    var vis = this;
};


LineChart.prototype.onSelectionChange = function(selectionStart, selectionEnd){
    var vis = this;

    // Filter original unfiltered data depending on selected time period (brush)
    vis.filteredData = vis.data.filter(function(d){
        return d.time >= selectionStart && d.time <= selectionEnd;
    });

    vis.wrangleData();
};

LineChart.prototype.regress = function(feedback){
    var vis = this;

    var n = feedback.length;
    var y = feedback.map(function(data){
        var tot = data.reduce(function(a,b){ return a+b });
        return tot / data.length;
    });
    var x = d3.range(n);

    var x_bar = x.reduce(function(a,b){ return a+b; }) / n;
    var y_bar = y.reduce(function(a,b){ return a+b; }) / n;

    var divisor = 0;
    var dividend = 0;
    for (var i = 0; i < n; i++) {
        xr = x[i] - x_bar;
        yr = y[i] - y_bar;
        divisor += xr * yr;
        dividend += xr * xr;
    }

    var b1 = divisor / dividend;
    var b0 = y_bar - (b1 * x_bar);

    return [0, n-1, b0, b1*(n-1)+b0];
};

/*
* Regression line
* lineVis.svg.append("line").attr("x1", lineVis.x(0)).attr("x2", lineVis.x(36)).attr("y1", lineVis.y(b0)).attr("y2", lineVis.y(b1*36+b0)).attr("stroke", "black")
*
* */