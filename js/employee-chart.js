var dateFormatter = d3.timeFormat("%Y-%m-%d");

EmployeeChart = function(_parentElement, _data){
    this.parentElement = _parentElement
    this.data = _data
    this.displayData = []
    this.initVis()
}

EmployeeChart.prototype.initVis = function () {
    var vis = this
    vis.formatNumber = d3.format("s");

    vis.width = 960,
    vis.height = 500,
    vis.barHeight = vis.height / 2 - 40;
    vis.color = d3.scaleOrdinal()
        .domain([1,5])
        .range(["#bebada","#fb8072","#80b1d3","#fdb462","#b3de69"])//,"#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]);
    // console.log("inside employee chart")
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width)
        .attr("height", vis.height)
        .append("g")
        .attr("transform", "translate(" + vis.width/2 + "," + vis.height/2 + ")");
    vis.barScale = d3.scaleLinear()
        .range([0, vis.barHeight]);

    // console.log("-vis.barHeight",-vis.barHeight)
    vis.x = d3.scaleLinear()
        // .domain(extent)
        .range([0, -vis.barHeight]);

    vis.xAxis = d3.axisLeft()
        .scale(vis.x)
        .ticks(3)
        // .tickFormat(vis.formatNumber);
    vis.tooltip = vis.svg.append('g')
        .attr('class', 'tooltip');

    vis.wrangleData()

}
EmployeeChart.prototype.wrangleData = function () {
    var vis = this
    vis.displayData = vis.data.getSprints()
    // console.log(vis.displayData)
    var scrumIds = []
    var listOfIssues = []
    vis.displayData.forEach(function(d){
        scrumIds.push(d["id"])
    })
    // console.log(vis.displayData)
    // console.log(scrumIds)
    scrumIds.forEach(function(d){
        // console.log(d,vis.data.getIssuesForSprint(d))
        listOfIssues.push({key:d,value:vis.data.getIssuesForSprint(d)})
    })
    // console.log(listOfIssues)
    for (var key in listOfIssues) {
        // check if the property/key is defined in the object itself, not in parent
        listOfIssues.forEach(function(d){

        })
    }

    // vis.currentSprint = listOfIssues["48011"]
    vis.activeSprint = vis.displayData.filter(function(d){
        return d.state == "ACTIVE"
    })
    vis.activeSprint= vis.activeSprint[0]
    vis.currentSprint = vis.data.getIssuesForSprint(vis.activeSprint["id"])
    vis.dataset = []
    vis.currentSprint.forEach(function (d,i) {
        startDate = new Date(dateFormatter(d.fields.created))
         var endDate
            if (d.fields.resolutiondate == null){
                endDate= new Date(dateFormatter(new Date()))
            }else{
                endDate= new Date(dateFormatter(d.fields.resolutiondate))
            }

        status = d.fields.status.name
        var stateName
        if (status == "Closed"){
            status= 1
            stateName="Closed"
        }
        if (status == "Blocked"){
            status= 2
            stateName="Blocked"
        }
        if (status == "Code Review"){
            status= 3
            stateName="Code Review"
        }
        if (status == "In Progress"){
            status= 4
            stateName="In Progress"
        }
        if (status == "Open"){
            status= 5
            stateName="Open"

        }

        timeSpent = ((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24))
        if (timeSpent > 14){
            timeSpent=14
        }
        if (timeSpent ==1){
            timeSpent=6
        }
        if (timeSpent ==0){
            timeSpent=8
        }
        if (timeSpent ==4){
            timeSpent=7
        }
        if (d.fields.assignee == null) {
            if (d.isResolved ==true){
                vis.dataset.push({name:"Manish Babel"+i,state:status,statusName:stateName,time:timeSpent,key:i})
            }
            else{
                vis.dataset.push({name:"Manish Babel"+i,state:status,statusName:stateName,time:timeSpent,key:i})
            }
        } else {
            if (d.isResolved ==true){
                vis.dataset.push({name:d.fields.assignee.displayName,state:status,statusName:stateName,time:timeSpent,key:d.fields.assignee.key+i})
            }
            else{
                vis.dataset.push({name:d.fields.assignee.displayName,state:status,statusName:stateName,time:timeSpent,key:d.fields.assignee.key+i})
            }
            return
        }
    })
    vis.dataset.sort(function(a,b){
        return a.time-b.time
    })
    vis.updateVis()

}
EmployeeChart.prototype.updateVis = function (value) {
    var vis = this
    tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return d.statusName; });
    vis.svg.call(tip)
    vis.currentSprint =vis.dataset
    // console.log("dataset",vis.dataset)
    var extent = d3.extent([0,14])
    // console.log("extend",extent)
    vis.x.domain(extent)
    vis.barScale.domain(extent)
    var keys = vis.currentSprint.map(function(d,i) {
        // console.log(d.fields.assignee )
        return d.key
    });
    // console.log("keys",keys)
    var numBars = keys.length;

    var circles = vis.svg.selectAll("circle")
        .data(vis.x.ticks(4))
        .enter().append("circle")
        .attr("class","inner")
        .attr("r", function(d) {
            // console.log(d,vis.barScale(d))
            return vis.barScale(d);})
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-dasharray", "2,2")
        .style("stroke-width",".5px");

    var arc = d3.arc()
        .startAngle(function(d,i) { return (i * 2 * Math.PI) / numBars; })
        .endAngle(function(d,i) { return ((i + 1) * 2 * Math.PI) / numBars; })
        .innerRadius(0);

    var segments = vis.svg.selectAll(".arc")
        .data(vis.currentSprint)
        .enter().append("path")
        .attr("class","arc")
        .each(function(d) { d.outerRadius = 0; })
        .style("fill", function (d) { return vis.color(d.state); })
        .attr("d", arc);
    // console.log("segments",segments)
    segments.transition().ease(d3.easeLinear).duration(10000).delay(function(d,i) {return (25-i)*100;})
        .attrTween("d", function(d,index) {
            // console.log("seg",d)
            var i = d3.interpolate(d.outerRadius, vis.barScale(+d.time));
            return function(t) { d.outerRadius = i(t); return arc(d,index); };
        });
    segments.on('mouseover', tip.show)
    segments.on('mouseout', tip.hide)
    function showTooltip(d) {
        vis.tooltip.style('left', (d3.event.pageX + 10) + 'px')
            .style('top', (d3.event.pageY - 25) + 'px')
            .style('display', 'inline-block')
            .text(d.statusName);
    }

    function hideTooltip() {
        vis.tooltip.style('display', 'none');
    }

        vis.svg.append("circle")
        .attr("r", vis.barHeight)
        .attr("class", "outer")
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width","1.5px");
    // console.log(keys)
    var lines = vis.svg.selectAll("line")
        .data(keys)
        .enter().append("line")
        .attr("y2", -vis.barHeight - 20)
        .style("stroke", "black")
        .style("stroke-width",".5px")
        .attr("transform", function(d, i) { return "rotate(" + (i * 360 / numBars) + ")"; });
    // console.log("vis.xAxis",vis.xAxis)
    vis.svg.append("g")
        .attr("class", "x axis")
        .call(vis.xAxis);

    // Labels
    var labelRadius = vis.barHeight * 1.025;

    var labels = vis.svg.append("g")
        .attr("class","labels")

    labels.append("def")
        .append("path")
        .attr("id", "label-path")
        .attr("d", "m0 " + -labelRadius + " a" + labelRadius + " " + labelRadius + " 0 1,1 -0.01 0");

    labels.selectAll("text")
        .data(vis.currentSprint)
        .enter().append("text")
        .style("text-anchor", "middle")
        .style("font-weight","bold")
        .style("fill", function(d, i) {return "#3e3e3e";})
        .append("textPath")
        .attr("xlink:href", "#label-path")
        .attr("startOffset", function(d, i) {return i * 100 / numBars + 50 / numBars + '%';})
        .text(function(d){
            // console.log(d)

            return d.name.split(" ")[0].toUpperCase()
        });



}