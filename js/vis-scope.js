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
            console.log("eventtriggeered",d);
            visStory2.storyChart.onSelectionChange(d);
        });
    }

    get data(){return this._data;}
    get svg(){return this._svg;}

    initVis(){
        var vis = this;
        const diameter = 600;
        vis.margin = { top: 60, right: 60, bottom: 60, left: 60 };
        vis.width = 500;
        vis.height = 600;
        vis.svgElem = d3.select("#" + vis.parentElement).append("svg")
            .attr("width",  vis.width  )
            .attr("height",  vis.height  );
        vis.defs = vis.svg.svg.append("defs");
        
        vis.radiusScale = d3.scaleSqrt().domain([0,11]).range([20,60]);
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

    wrangleData = function (){
        const vis = this;
        vis.displayData = vis.data.getSprints();
        vis.activeSprint = vis.displayData.filter((d)=> d.state == "ACTIVE");
        vis.activeSprint= vis.activeSprint[0];
        vis.storiesForActiveSprint = vis.data.getIssuesForSprint(vis.activeSprint["id"]);
        vis.updateVis();
    }

//TODO Manish:  Leverage Enter, Update, Exit pattern so that when
// the Watch Replay button is pressed and calls updataVis, the vis re-renders
    updateVis = function (value){
        const vis = this
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

        d3.selectAll("#inProgress").on("click",()=>
            vis.simulation.force("x",vis.forceXSPlit)
                .alphaTarget(0.5)
                .restart()
        );
        d3.selectAll("#all").on("click",()=>
            vis.simulation.force("x",vis.forceXAll)
                .alphaTarget(0.5)
                .restart()
        );
        function ticked(){
            circles.attr("cx",function(d){
                return d.x
            }).attr("cy",d => d.y)
        }
    }
}