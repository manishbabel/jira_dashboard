
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
    vis.margin = { top: 50, right: 0, bottom: 30, left: 50 };

    vis.width = 400 - vis.margin.left - vis.margin.right,
        vis.height = 350 - vis.margin.top - vis.margin.bottom;

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
            return "dotG " + cat;
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
        .attr("cy", function(d){ return vis.y(d); })
        .attr("r", 5)
        .attr("fill", function(d,i){ return vis.color(d3.select(this).attr("class").split(" ")[1]); })
        .on("click", function(){
            var cat = d3.select(this).attr("class").split(" ")[1];
            $(".dotG." + cat).hide();
            $(".lines." + cat).show();
            $(".dots." + cat).show();
        });

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
            d3.select(this).attr("r", 8);
        })
        .on("mouseout", function(d,i){
            d3.select(this).attr("r", 5);

            $("#sprint-tool").hide();
            $("#score-tool").hide();

            $(".line").attr("opacity", 1);
            $(".dots").attr("opacity", 1);
        })
        .on("click", function(){
            var cat = d3.select(this).attr("class").split(" ")[1];
            $(".dotG." + cat).show();
            $(".lines." + cat).hide();
            $(".dots." + cat).hide();
        });
    ;


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

    console.log(x_bar)
    console.log(y_bar)
    var divisor = 0;
    var dividend = 0;
    for (var i = 0; i < n; i++) {
        xr = x[i] - x_bar;
        yr = y[i] - y_bar;
        divisor += xr * yr;
        dividend += xr * xr;;
        console.log(xr)
        console.log(yr)

    }

    var b1 = divisor / dividend;
    var b0 = y_bar - (b1 * x_bar);

    return [b0, b1];
};

/*
* Small multiples?
* Explode into dotplot
* Regression line
* lineVis.svg.append("line").attr("x1", lineVis.x(0)).attr("x2", lineVis.x(36)).attr("y1", lineVis.y(b0)).attr("y2", lineVis.y(b1*36+b0)).attr("stroke", "black")
*
* */