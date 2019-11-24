class ScopeChart {
    constructor(data, svg, visStory2) {
        this._data = data;
        this._svg = svg;
        const eventHandler = {};
        this.parentElement = this.svg.container.substr(1);
        this.displayData = [];
        this.eventHandler = eventHandler;
        this.initVis();
        $(eventHandler).bind("selectionChanged", function(event, d) {
            visStory2.storyChart.onSelectionChange(d);
        });
    }

    get data(){return this._data;}
    get svg(){return this._svg;}

    initVis(){
        var vis = this;
        vis.margin = { top: 60, right: 60, bottom: 60, left: 60 };
        vis.width = 600;
        vis.height = 400;
        vis.svgElem = d3.select("#" + vis.parentElement).append("svg")
            .attr("width",  vis.width  )
            .attr("height",  vis.height  );
        vis.defs = vis.svg.svg.append("defs");
        
        vis.radiusScale = d3.scaleSqrt().domain([0,11]).range([20,60]);
        vis.forceXSPlit = d3.forceX(function(d){
            if(d.isResolved == true){
                return 150
            }
            else{
                return 400
            }

        }).strength(0.06)
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

    wrangleData = function (){
        const vis = this;
        vis.displayData = vis.data.getSprints();
        vis.activeSprint = vis.displayData.filter((d)=> d.state == "ACTIVE");
        vis.activeSprint= vis.activeSprint[0];
        vis.storiesForActiveSprint = vis.data.getIssuesForSprint(vis.activeSprint["id"]);
        console.log("stories",vis.storiesForActiveSprint)
        vis.status = [{name:"Resolved",x:150},
            {name:"In Progress",x:400}]
        vis.updateVis();
    }

    updateVis = function (value){
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
            });
        const circles = vis.svgElem.selectAll(".bubble")
            .data(vis.storiesForActiveSprint)
            .enter().append("circle")
            .attr("class","bubble")
            .attr("r",d => vis.radiusScale(d.storyPoints))
            .attr("fill", d => ("url(#"+d.id+")"))
            .on("click",function(d){
                $(vis.eventHandler).trigger("selectionChanged", d)
            });
        vis.simulation.nodes(vis.storiesForActiveSprint)
            .on("tick",ticked);

        d3.selectAll("#status").on("click.title",()=>
            vis.simulation.force("x",vis.forceXSPlit)
                .alphaTarget(0.5)
                .restart()
        );
        d3.selectAll("#status").on("click",function (){showStatusTitles(vis.status)});
        d3.selectAll("#all").on("click.title",()=>
            vis.simulation.force("x",vis.forceXAll)
                .alphaTarget(0.5)
                .restart()
        );
        d3.selectAll("#all").on("click",function (){showStatusTitles([])});
        function ticked(){
            circles.attr("cx",function(d){
                return d.x
            }).attr("cy",d => d.y)
        }
       function showStatusTitles(split) {
            var titles = vis.svgElem.selectAll('.title')
                .data(split);

            titles.enter(titles).append('text')
                .attr('class', 'title')
                .merge(titles).transition().duration(1000)
                .attr('x', function (d) { return d.x })
                .attr('y', 20)
                .attr('text-anchor', 'middle')
                .text(function (d) { return d.name; });
           titles.exit().remove()
        }
    }
}