
class ScopeChart {
    constructor(data, svg, visStory2,sprint_id, colorScheme, eventHandler) {
        this._data = data;
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

    get data(){return this._data;}
    get svg(){return this._svg;}

    initVis(){
        var vis = this;
        vis.imageMap = {ked358 :"img/aa.png" ,mab7461 :"img/bb.png" ,jam7652 :"img/cc.png" ,admin :"img/dd.png"};
        var border=1;
        var bordercolor='black';
        vis.margin = { top: 60, right: 60, bottom: 60, left: 60 };
        vis.width = 800;
        vis.height = 800;
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
        vis.radiusScale = d3.scaleSqrt().domain([0,11]).range([10,30]);

        //create color scale
        vis.colorScale = d3.scaleOrdinal();

        // cluster groups based on scrum team members.
        // For the current design we have assumed we have 4 team members. This can be extended as needed to dynamically group with team mates
        vis.forceXSPlit = d3.forceX(function(d){
            if(d.fields.assignee ==null){
                return 20
            }
            else if(d.fields.assignee.key == "ked358"){
                return 130
            }
            else if(d.fields.assignee.key == "mab7461"){
                return 290
            }else if(d.fields.assignee.key == "jam7652"){
                return 470
            }else if(d.fields.assignee.key == "admin"){
                return 660
            }


        }).strength(0.05)

        //Force simulation settings for bubbles
        vis.forceXAll = d3.forceX(vis.width/2).strength(0.05)
        var forceCollide = d3.forceCollide(function(d){
            return  vis.radiusScale(d.storyPoints)+2
        })
        vis.simulation = d3.forceSimulation()
            .force("x",vis.forceXAll)
            .force("y",d3.forceY(vis.height/2).strength(0.05))
            .force("collide",forceCollide)
        vis.wrangleData()
    }

    wrangleData = function (){
        const vis = this;

        // get stories for active sprint
        if (vis.sprint_id == "") {
            //console.log("_data",vis._data)
            vis.storiesForSprint = vis._data.activeSprint.issues
          }else{
            vis.storiesForSprint = vis._data.sprintMap[vis.sprint_id]
        }

        //filter out sub-tasks
        vis.storiesForSprint = vis.storiesForSprint.filter(function(d){
            // console.log("subtask",d.fields.issuetype.subtask)
            return d.fields.issuetype.subtask ==false
        })
        //console.log('vis.storiesForSprint',vis.storiesForSprint)

        //update color scale range
        vis.colorScale.range(vis.colorScheme.filter(function (d,i) {
            //needed as the legend needs the domain and range lengths to match
            return i < vis.data.selectedIssueProperty.length;
        }));
        vis.colorScale.domain(vis.data.selectedIssueProperty);

        vis.updateVis();
    }

    updateVis = function (value) {
        var vis = this

        displayImagesForScrumTeam(vis);
        displayTitle(vis);

        getImageSVGDef(vis);

        var circles = vis.svgElem.selectAll(".bubble")
            .data(vis.storiesForSprint)
            .enter().append("circle")
            .attr("class", "bubble")
            .attr("r", d => vis.radiusScale(d.storyPoints))
            .attr("stroke",1)
            .on("click", function (d) {
                generateDynamicText(d);
               $(vis.eventHandler).trigger("scopeBubbleSelectionChanged", d)
            })
            .call(d3.drag()
                .on("start", (d) => {
                    if (!d3.event.active) { vis.simulation.alphaTarget(0.2).restart(); }
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (d) => {
                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                })
                .on("end", (d) => {
                    if (!d3.event.active) { vis.simulation.alphaTarget(0); }
                    d.fx = null;
                    d.fy = null;
                })
            )
            .on ("mouseover",function(d){
                d3.select(this).style('stroke', 'black');
            })
            .on ("mouseout",function(d){
            d3.select(this).style('stroke', 'white');
        });

        vis.svgElem.selectAll(".bubble")
            .attr("fill", function (d) {
                return vis.colorScale(vis.data.getSelectedIssuePropertyValue(d));
            });

        vis.simulation.nodes(vis.storiesForSprint)
            .on("tick", ticked);

        vis.simulation.force("x", vis.forceXSPlit)
            .alphaTarget(0.5)

        function ticked() {
            circles.attr("cx", function (d) {
                return d.x
            }).attr("cy", d => d.y)
        }

        displayStoryPointsLegend(vis);


    }
}

function displayImagesForScrumTeam(vis) {
    var image1 = vis.svgElem.append("image")
        .attr("xlink:href", "img/a.jpg")
        .attr("class", "image")
        .attr("x", 60)
        .attr("y", 450)
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")
        .attr("x", 130)
        .attr("y", 600)
        .attr("stroke", "#8dd3c7")
        .text("Kevin");

    var image2 = vis.svgElem.append("image")
        .attr("xlink:href", "img/b.jpg")
        .attr("class", "image")
        .attr("x", 220)
        .attr("y", 450)
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")
        .attr("x", 290)
        .attr("y", 600)
        .attr("stroke", "#fb8072")
        .text("Manish");
    var image3 = vis.svgElem.append("image")
        .attr("xlink:href", "img/c.jpg")
        .attr("class", "image")
        .attr("x", 420)
        .attr("y", 450)
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")
        .attr("x", 490)
        .attr("y", 600)
        .attr("stroke", "#b3de69")
        .text("James");
    var image4 = vis.svgElem.append("image")
        .attr("xlink:href", "img/d.jpg")
        .attr("class", "image")
        .attr("x", 600)
        .attr("y", 450)
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")
        .attr("x", 670)
        .attr("y", 600)
        .attr("stroke", "#bebada")

        .text("David");
}

function displayTitle(vis) {
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_Small")
        // .attr("text-anchor", "end")
        .attr("x", 100)
        .attr("y", 50)
        .attr("stroke", "black")
        // .attr("stroke-width","8px")
        .text("Scrum Team - Who is working on what? Click on work item bubbles ");

    vis.svgElem.append("text")
        .attr("class", "story-text1 ")
        .attr("x", 30)
        .attr("y", 90)
        .attr("font-family", "Solway")
        .attr("font-size", "14px")
        .text("");

    vis.svgElem.append("text")
        .attr("class", "story-text2")
        .attr("x", 30)
        .attr("y", 110)
        .attr("font-family", "Solway")
        .attr("font-size", "14px")
        .text("");

    vis.svgElem.append("text")
        .attr("class", "story-text3")
        .attr("x", 30)
        .attr("y", 130)
        .attr("font-family", "Solway")
        .attr("font-size", "14px")
        .text("");
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

function generateDynamicText(d) {
    var assigneeDesc = ""
    var storyDesc = ""

    if (d.fields.summary == null) {
        storyDesc = ""
    } else {
        storyDesc = "Goal of this story is to " + d.fields.summary
    }
    if (d.fields.assignee == null) {
        assigneeDesc = "This story is unassigned"
    } else {
        if (d.isResolved == true) {
            assigneeDesc = d.fields.assignee.displayName + " completed this story"

        } else {
            assigneeDesc = d.fields.assignee.displayName + " is working on this story"

        }
    }
    d3.select(".story-text1").text(assigneeDesc)
    d3.select(".story-text2").text("This story is of " + d.storyPoints + " points.")
    d3.select(".story-text3").text(storyDesc)
}

function displayStoryPointsLegend(vis) {
// Add legend: circles

    var valuesToShow = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    var xCircle = 500
    var xLabel = 580
    var yCircle = 727
    vis.svgElem
        .selectAll("legend")
        .data(valuesToShow)
        .enter()
        .append("circle")
        .attr("cx", xCircle)
        .attr("cy", function (d) {
            return yCircle - vis.radiusScale(d)
        })
        .attr("r", function (d) {
            return vis.radiusScale(d)
        })
        .style("fill", "none")
        .attr("stroke", "black")

// Add legend: segments
//         vis.svgElem
//             .selectAll("legend")
//             .data(valuesToShow)
//             .enter()
//             .append("line")
//             .attr('x1', function(d,i){ return xCircle + vis.radiusScale(d) } )
//             .attr('x2', xLabel)
//             .attr('y1', function(d,i){ return yCircle - vis.radiusScale(d*(i)) } )
//             .attr('y2', function(d,i){ return yCircle - vis.radiusScale(d*(2*i+7)) } )
//             .attr('stroke', 'black')
//             .style('stroke-dasharray', ('2,2'))

// Add legend: labels
//         vis.svgElem
//             .selectAll("legend")
//             .data(valuesToShow)
//             .enter()
//             .append("text")
//             .attr("class", "PT_Serif_Legend")
//             .attr('x', xLabel)
//             .attr('y', function(d,i){ return yCircle - vis.radiusScale(d*(3*i)) } )
//             .text( function(d){ return d } )
//             .style("font-size", 10)
//             .attr('alignment-baseline', 'middle')
    vis.svgElem.append("rect")
        .attr("x", 450)
        .attr("y", 650)
        .attr("height", 100)
        .attr("width", 270)
        .style("stroke", "black")
        .style("fill", "none")
        .style("stroke-width", vis.border);
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_Legend")
        // .attr("text-anchor", "end")
        .attr("x", 560)
        .attr("y", 700)
        .attr("stroke", "black")
        // .attr("stroke-width","8px")
        .text("Story Points (0-11)");
}
