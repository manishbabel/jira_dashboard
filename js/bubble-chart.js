
BubbleChart = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement
    this.data = _data
    this.displayData = []
    this.eventHandler =_eventHandler
    this.initVis()
}

BubbleChart.prototype.initVis = function (){
    var vis = this
    const diameter = 600;
    vis.margin = { top: 60, right: 60, bottom: 60, left: 60 };
    vis.width = 700
    vis.height = 600
     vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width",  vis.width  )
        .attr("height",  vis.height  )
        // .append("g").attr("transform", "translate(" + 0   + "," + ( vis.width  ) + ")");
    vis.defs = vis.svg.append("defs")


    vis.radiusScale = d3.scaleSqrt().domain([0,11]).range([20,60])
    vis.forceXSPlit = d3.forceX(function(d){
        if(d.isResolved == true){
            return 100
        }
        else{
            return 700
        }

    }).strength(0.05)
    vis.forceXAll = d3.forceX(vis.width/2).strength(0.05)
    var forceCollide = d3.forceCollide(function(d){
        return  vis.radiusScale(d.storyPoints)+5
    })
    vis.simulation = d3.forceSimulation()
                        .force("x",vis.forceXAll)
                        .force("y",d3.forceY(vis.height/2).strength(0.05))
                        .force("collide",forceCollide)
     vis.wrangleData()
}
BubbleChart.prototype.wrangleData = function (){
    var vis = this
    vis.displayData = vis.data.getSprints()
    vis.activeSprint = vis.displayData.filter(function(d){
        return d.state == "ACTIVE"
    })
    vis.activeSprint= vis.activeSprint[0]
    vis.storiesForActiveSprint = vis.data.getIssuesForSprint(vis.activeSprint["id"])
    vis.updateVis()


}
BubbleChart.prototype.updateVis = function (value){
    var vis = this
    // console.log('vis.storiesForActiveSprint',vis.storiesForActiveSprint)
    vis.defs.selectAll(".scrum-pattern")
        .data(vis.storiesForActiveSprint).enter()
        .append("pattern")
        .attr("class","scrum-pattern")
        .attr("id",function(d){
            return d.id
        })
        .attr("height","100%")
        .attr("width","100%")
        .attr("patternContentUnits","objectBoundingBox")
        .append("image")
        .attr("height","1")
        .attr("width","1")
        .attr("preserveAspectRatio","xMidYMid slice")
        .attr("xlink:href",function(d,i) {
            return "img/"+i+".png"
            // return d.fields.assignee.avatarUrls["16x16"]
        })
    var circles = vis.svg.selectAll(".bubble")
        .data(vis.storiesForActiveSprint)
        .enter().append("circle")
        .attr("class","bubble")
        .attr("r",function(d){
            // console.log(d.storyPoints)
            return vis.radiusScale(d.storyPoints)
        })
       .attr("fill", function(d){
           return ("url(#"+d.id+")")
       })
        .on("click",function(d){
            $(vis.eventHandler).trigger("selectionChanged", d)
        })
    vis.simulation.nodes(vis.storiesForActiveSprint)
        .on("tick",ticked)

    d3.selectAll("#inProgress").on("click",function(d){
        vis.simulation.force("x",vis.forceXSPlit)
            .alphaTarget(0.5)
            .restart()
    })
    d3.selectAll("#all").on("click",function(d){
        vis.simulation.force("x",vis.forceXAll)
            .alphaTarget(0.5)
            .restart()

    })
    function ticked(){
        circles.attr("cx",function(d){
            return d.x
        }).attr("cy",function(d){
            return d.y
        })
    }
}



