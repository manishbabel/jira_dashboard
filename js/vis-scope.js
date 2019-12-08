
class ScopeChart {
    constructor(issueStore, svg, visStory2,sprint_id, colorScheme, eventHandler) {
        this._issueStore = issueStore;
        this._svg = svg;
        this.sprint_id = sprint_id
        this.parentElement = this.svg.container.substr(1);
        this.displayData = [];
        this.eventHandler = eventHandler;
        this.colorScheme = colorScheme;
        this.initVis();

        $(eventHandler).bind("scopeBubbleSelectionChanged", function(event, d) {
            //console.log("eventtriggeered",d);
            visStory2.storyChart.onSelectionChange(d);
        });
    }

    get issueStore(){return this._issueStore;}
    get svg(){return this._svg;}

    initVis(){
        var vis = this;
        vis.imageMap = {ked358 :"img/aa.png" ,mab7461 :"img/bb.png" ,jam7652 :"img/cc.png" ,admin :"img/dd.png"};
        var border=1;
        var bordercolor='black';
        vis.margin = { top: 60, right: 60, bottom: 60, left: 60 };
        vis.width = 800;
        vis.height = 700;
        vis.svgElem = d3.select("#" + vis.parentElement).append("svg")
            .attr("width",  vis.width  )
            .attr("height",  vis.height  )
            .attr("border",border)

        // Create border for SVG
        var borderPath = vis.svgElem.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", vis.height)
            .attr("width", vis.width)
            .style("stroke", bordercolor)
            .style("fill", "none")
            .style("stroke-width", border);

        //Definitions for svg image
        vis.defs = vis.svg.svg.append("defs");
        // scale to change radius for bubbles based on story size
        vis.radiusScale = d3.scaleSqrt().domain([0, 1, 3, 5, 8]).range([10, 15, 19, 24, 27]);

        //create color scale
        vis.colorScale = d3.scaleOrdinal();

        // cluster groups based on scrum team members.
        // For the current design we have assumed we have 4 team members. This can be extended as needed to dynamically group with team mates
        vis.forceXSPlit = d3.forceX(function(d){
            if(d.fields.assignee ==null){
                return 70
            }
            else if(d.fields.assignee.key == "admin"){
                return 230
            }
            else if(d.fields.assignee.key == "mab7461"){
                return 375
            }else if(d.fields.assignee.key == "jam7652"){
                return 570
            }else if(d.fields.assignee.key == "ked358"){
                return 735
            }


        }).strength(0.08)

        //Force simulation settings for bubbles
        vis.forceXAll = d3.forceX(vis.width/2).strength(0.04)
        var forceCollide = d3.forceCollide(function(d){
            return  vis.radiusScale(d.storyPoints)+3
        })
        vis.simulation = d3.forceSimulation()
            .force("x",vis.forceXAll)
            .force("y",d3.forceY(vis.height/4).strength(0.04))
            .force("collide",forceCollide)

        displayStoryPointsLegend(vis);
        displayTitle(vis);
        displayIssuePropertyLegend(vis);
        displayUserLabels(vis);


        vis.wrangleData();
        vis.renderVis();
    }

    wrangleData = function (){
        const vis = this;
        vis.memberStory= []
        // get stories for active sprint
        vis.storiesForSprint = vis.issueStore.selectedSprint.issues;

        //filter out sub-tasks
        vis.storiesForSprint = vis.storiesForSprint.filter(function(d){
            // console.log("subtask",d.fields.issuetype.subtask)
            return d.fields.issuetype.subtask ==false
        });

        //update color scale range
        vis.colorScale.range(vis.colorScheme.filter(function (d,i) {
            //needed as the legend needs the domain and range lengths to match
            return i < vis.issueStore.selectedIssueProperty.length;
        }));
        vis.storiesForSprint.forEach(function (d) {
            if (d.fields.assignee != null) {
                vis.memberStory.push({name:d.fields.assignee.key,storyPoints:d.storyPoints})
            }
        })

        vis.nested_data = d3.nest()
            .key(function(d) { return d.name; })
            // .key(function(d) { return d.priority; })
            .rollup(function(leaves) { return {"total_time": d3.sum(leaves, function(d) {return  (d.storyPoints);})} })
            .entries(vis.memberStory);
        vis.colorScale.domain(vis.issueStore.selectedIssueProperty);
        vis.map =[]
        vis.nested_data.forEach(function(d){
            if (d.key =="admin"){
                vis.map.push({id:d.key,name:"david",sp:d.value['total_time'],x:170,y:290})
            }
            if (d.key =="mab7461"){
                vis.map.push({id:d.key,name:"manish",sp:d.value['total_time'],x:320,y:290})
            }
            if (d.key =="jam7652"){
                vis.map.push({id:d.key,name:"james",sp:d.value['total_time'],x:490,y:290})
            }
            if (d.key =="ked358"){
                vis.map.push({id:d.key,name:"kevin",sp:d.value['total_time'],x:665,y:290})
            }
        })
        // console.log(vis.map);
    }

    updateVis = function() {
        var vis = this;
        vis.wrangleData();
        displayImagesForScrumTeam(vis);
        vis.simulation.restart();
        vis.simulation.nodes(vis.storiesForSprint);

        var n = vis.svgElem.selectAll(".node")
            .data(vis.storiesForSprint);
        vis.enterNodes(n);
        vis.exitNodes(n);
        vis.node = vis.svgElem.selectAll(".node");
    }

    onSelectedPropertyChange = function() {
        var vis = this;
        vis.wrangleData();
        vis.node.attr("fill", function (d) {
            return vis.colorScale(vis.issueStore.getSelectedIssuePropertyValue(d));
        });
        vis.issuePropertyControl.updateVis();
    };

    onSelectedVisualizationChange = function() {
        var vis = this;
        vis.issuePropertyControl.updateVis();
    }

    enterNodes = function(n) {
        var vis = this;
        var g = n.enter()
            .append("circle")
            .attr("class", "node")
            .attr("r", d => vis.radiusScale(d.storyPoints))
            .attr("stroke","white")
            .on("click", function (d) {
                $(vis.eventHandler).trigger("scopeBubbleSelectionChanged", d)
            })
            .on ("mouseover",function(d){
                d3.select(this).style('stroke', 'black');
                d3.select(this).style("cursor", "pointer");
            })
            .on ("mouseout",function(d){
                d3.select(this).style('stroke', 'white');
                d3.select(this).style("cursor", "default");
            })
            .attr("fill", function (d) {
                return vis.colorScale(vis.issueStore.getSelectedIssuePropertyValue(d));
            })
            // .call(d3.drag()
            //     .on("start", (d) => {
            //         if (!d3.event.active) { vis.simulation.alphaTarget(0.2).restart(); }
            //         d.fx = d.x;
            //         d.fy = d.y;
            //     })
            //     .on("drag", (d) => {
            //         d.fx = d3.event.x;
            //         d.fy = d3.event.y;
            //     })
            //     .on("end", (d) => {
            //         if (!d3.event.active) { vis.simulation.alphaTarget(0); }
            //         d.fx = null;
            //         d.fy = null;
            //     })
            // );
    };

    exitNodes = function(n) {
        n.exit().remove();
    };

    renderVis = function (value) {
        var vis = this;
        displayImagesForScrumTeam(vis);


        vis.simulation.nodes(vis.storiesForSprint);
        var nodes = vis.svgElem.selectAll(".node")
            .data(vis.storiesForSprint);
        vis.enterNodes(nodes);
        vis.node = vis.svgElem.selectAll(".node");

        vis.simulation.force("x", vis.forceXSPlit)
            .alphaTarget(0.5)

        vis.simulation.on("tick", function() {
            vis.node.attr("cx", function (d) {
                return d.x
            }).attr("cy", d => d.y)
        });
        getImageSVGDef(vis);

    }

}

function displayImagesForScrumTeam(vis) {
    var unassigned = vis.svgElem.append("image")
        .attr("xlink:href", "img/unassigned.png")
        .attr("class", "image1")
        .attr("x", 1)
        .attr("y", 290)
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        // .attr("text-anchor", "middle")
        .attr("x", 40)
        .attr("y", 450)
        .attr("stroke", "#fdb462")
        .text("Un-Assigned");
    vis.img = vis.svgElem.selectAll(".assignee-image")
        .data(vis.map)

    vis.img.enter().append("image")
        .attr("class", "assignee-image")
        .merge(vis.img)
        .attr("xlink:href", function(d,i){
            // console.log(d.name + " " + d.sp );
            if( d.sp > 22){
                return "img/"+d.name+"_sad.png"
            }else{
                return "img/"+d.name+"_happy.png"
            }
        })
        .attr("x", function(d){return d.x})
        .attr("y",function(d){return d.y})

    vis.img.exit().remove()
}

function displayTitle(vis) {
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_Small")
        // .attr("text-anchor", "end")
        .attr("x", 290)
        .attr("y", 30)
        .attr("stroke", "black")
        // .attr("stroke-width","8px")
        .text("Click on the work item bubbles!");


}

function getImageSVGDef(vis) {
    vis.defs.selectAll(".scrum-pattern")
        .data(vis.storiesForSprint).enter()
        .append("pattern")
        .attr("class", "scrum-pattern")
        .attr("id", function (d) {
            return d.id
        })
        .attr("height", "100%")
        .attr("width", "100%")
        .attr("patternContentUnits", "objectBoundingBox")
        .append("image")
        .attr("height", "1")
        .attr("width", "1")
        .attr("preserveAspectRatio", "xMidYMid slice")
        .attr("xlink:href", function (d, i) {
            if (d.fields.assignee == null) {
                return "img/ee.jpeg"
            } else {
                return vis.imageMap[d.fields.assignee["name"]]
            }
        })
        .attr("fill", "orange")
}



function displayStoryPointsLegend(vis) {
// Add legend: circles

    vis.svgElem.append("g")
        .attr("class", "legendSize")
        .attr("transform", "translate(450, 530)");

    var legendSize = d3.legendSize()
        .scale(vis.radiusScale)
        .shape('circle')
        .shapePadding(15)
        .labelOffset(20)
        .orient('horizontal')
        .labels([0,1,3,5,8])

    vis.svgElem.select(".legendSize")
        .call(legendSize)
    vis.svgElem.selectAll(".legendSize").each(function(d) {
        d3.select(this).style("fill", "none")
        d3.select(this).style("stroke", "black")
    })

    vis.svgElem.append("rect")
        .attr("x", 450)
        .attr("y", 500)
        .attr("height", 110)
        .attr("width", 310)
        .style("stroke", "black")
        .style("fill", "none")
        .style("stroke-width", vis.border);
    vis.svgElem.append("text")
        .attr("class", "legendTitle")
        // .attr("text-anchor", "end")
        .attr("x", 560)
        .attr("y", 480)
        .attr("stroke", "black")
        // .attr("stroke-width","8px")
        .text("Story Points");
}

function displayUserLabels(vis) {
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")

        .attr("x", 230)
        .attr("y", 450)
        .attr("stroke", "#bebada")

        .text("David");
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")
        .attr("x", 380)
        .attr("y", 450)
        .attr("stroke", "#fb8072")
        .text("Manish");

    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")
        .attr("x", 550)
        .attr("y", 450)
        .attr("stroke", "#b3de69")
        .text("James");

    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")
        .attr("x", 725)
        .attr("y", 450)
        .attr("stroke", "#8dd3c7")
        .text("Kevin");
}

function displayIssuePropertyLegend(vis) {
    var propertyLegend = vis.svgElem.append("g")
        .attr("transform", "translate(50, 470)");
    vis.issuePropertyControl = new IssuePropertyControl(propertyLegend, vis.colorScheme, vis.eventHandler, vis.issueStore, "scope-property-legend");
}
