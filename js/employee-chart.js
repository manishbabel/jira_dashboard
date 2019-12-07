class EmployeeChart2 {
    constructor(data, svg) {
        this._data = data;
        this._svg = svg;
        this._employeeChart =
            new EmployeeChart(this.svg.container.substr(1), this.data);
    }

    get data() {return this._data;}
    get svg() {return this._svg;}
    get employeeChart() {return this._employeeChart;}
}

EmployeeChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];
    this.initVis();
};

EmployeeChart.prototype.initVis = function () {
    const vis = this;
    vis.formatNumber = d3.format("s");

    vis.width = 960;
    vis.height = 500;
    vis.barHeight = vis.height / 2 - 40;
    vis.color = d3.scaleOrdinal()
        .domain([1,5])
        .range(["#bebada","#fb8072","#80b1d3","#fdb462","#b3de69"]);//,"#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]);

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width)
        .attr("height", vis.height)
        .append("g")
        .attr("transform", "translate(" + vis.width/2 + "," + vis.height/2 + ")");

    vis.barScale = d3.scaleLinear().range([0, vis.barHeight]);

    vis.x = d3.scaleLinear().range([0, -vis.barHeight]);

    vis.xAxis = d3.axisLeft()
        .scale(vis.x)
        .ticks(3);

    vis.tooltip = vis.svg.append('g')
        .attr('class', 'tooltip');

    vis.wrangleData()

};

EmployeeChart.prototype.wrangleData = function () {
    const vis = this;
    vis.displayData = vis.data.getSprints();
    const scrumIds = [];
    const listOfIssues = [];
    vis.displayData.forEach((d) => { scrumIds.push(d["id"]) });

    scrumIds.forEach(function(d){
        listOfIssues.push({key:d,value:vis.data.getIssuesForSprint(d)})
    });

    vis.activeSprint = vis.displayData.filter(d => d.state == "ACTIVE")[0];
    vis.currentSprint = vis.data.getIssuesForSprint(vis.activeSprint["id"]);
    vis.currentSprint = vis.currentSprint.filter(function(d){
        // console.log("kkkkkk",d)
        return d.fields.issuetype.subtask ==false
    })
    vis.dataset = [];
    vis.currentSprint.forEach(function (d,i) {
        const startDate = new Date(dateFormatter(d.fields.created))
         let endDate = null;
            if (d.fields.resolutiondate == null){
                endDate= new Date(dateFormatter(new Date()))
            }else{
                endDate= new Date(dateFormatter(d.fields.resolutiondate))
            }

        let status = d.fields.status.name;
        let stateName = "";
        // console.log('currentSprint',vis.currentSprint)
        switch(status) {
            case "Closed":
                status= 1;
                stateName="Closed";
                break;

            case "Blocked":
                status= 2;
                stateName="Blocked";
                break;

            case "Code Review":
                status= 3;
                stateName="Code Review";
                break;

            case "In Progress":
                status= 4;
                stateName="In Progress";
                break;

            case "Open":
                status= 5;
                stateName="Open";
                break;
        }


        let timeSpent = ((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24))
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
            var initials =""
            if (d.isResolved ==true){
                var initialName = (d.fields.assignee.displayName)
                initialName =initialName.split(' ')
                // console.log("initialName",initialName)
                if (initialName.length > 1) {
                    initials += initialName[0].substring(0, 1).toUpperCase() + initialName[1].substring(0, 1).toUpperCase();
                }
            // console.log(initials)
                vis.dataset.push({name:initials,state:status,statusName:stateName,time:timeSpent,key:d.fields.assignee.key+i})
            }
            else{
                vis.dataset.push({name:initials,state:status,statusName:stateName,time:timeSpent,key:d.fields.assignee.key+i})
            }
        }
    });

    vis.dataset.sort(function(a,b){
        return a.time-b.time
    });
    vis.updateVis()

};

EmployeeChart.prototype.updateVis = function () {
    const vis = this;
    const tip = d3.tip().attr('class','d3-tip').html(d => d.statusName);
    vis.svg.call(tip);
    vis.currentSprint =vis.dataset;
    const extent = d3.extent([0,14]);
    vis.x.domain(extent);
    vis.barScale.domain(extent);
    const keys = vis.currentSprint.map(d => d.key);
    const numBars = keys.length;

    const circles = vis.svg.selectAll("circle")
        .data(vis.x.ticks(4))
        .enter().append("circle")
        .attr("class","inner")
        .attr("r", d => vis.barScale(d))
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-dasharray", "2,2")
        .style("stroke-width",".5px");

    const arc = d3.arc()
        .startAngle((d,i) => (i * 2 * Math.PI) / numBars)
        .endAngle((d,i) => ((i + 1) * 2 * Math.PI) / numBars)
        .innerRadius(0);

    const segments = vis.svg.selectAll(".arc")
        .data(vis.currentSprint)
        .enter().append("path")
        .attr("class","arc")
        .each(d => d.outerRadius = 0)
        .style("fill", d => vis.color(d.state))
        .attr("d", arc);

    segments.transition().ease(d3.easeLinear).duration(10000).delay(function(d,i) {return (25-i)*100;})
        .attrTween("d", function(d,index) {
            const i = d3.interpolate(d.outerRadius, vis.barScale(+d.time));
            return function(t) { d.outerRadius = i(t); return arc(d,index); };
        });
    segments.on('mouseover', tip.show);
    segments.on('mouseout', tip.hide);
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

    const lines = vis.svg.selectAll("line")
        .data(keys)
        .enter().append("line")
        .attr("y2", -vis.barHeight - 20)
        .style("stroke", "black")
        .style("stroke-width",".5px")
        .attr("transform",(d, i) => "rotate(" + (i * 360 / numBars) + ")");

    vis.svg.append("g")
        .attr("class", "x axis")
        .call(vis.xAxis);

    // Labels
    const labelRadius = vis.barHeight * 1.025;

    const labels = vis.svg.append("g")
        .attr("class","labels");

    labels.append("def")
        .append("path")
        .attr("id", "label-path")
        .attr("d", "m0 " + -labelRadius + " a" + labelRadius + " " + labelRadius + " 0 1,1 -0.01 0");

    labels.selectAll("text")
        .data(vis.currentSprint)
        .enter().append("text")
        .style("text-anchor", "middle")
        .style("font-weight","bold")
        .style("fill", () => "#3e3e3e")
        .append("textPath")
        .attr("xlink:href", "#label-path")
        .attr("startOffset", function(d, i) {return i * 100 / numBars + 50 / numBars + '%';})
        .text(function(d){
            // console.log(d)

            return d.name.split(" ")[0].toUpperCase()
        });
};