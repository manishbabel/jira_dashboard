
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
        vis.radiusScale = d3.scaleSqrt().domain([0, 1, 3, 5, 8]).range([10, 15, 20, 25, 30]);

        //create color scale
        vis.colorScale = d3.scaleOrdinal();

        // cluster groups based on scrum team members.
        // For the current design we have assumed we have 4 team members. This can be extended as needed to dynamically group with team mates
        vis.forceXSPlit = d3.forceX(function(d){
            if(d.fields.assignee ==null){
                return 60
            }
            else if(d.fields.assignee.key == "ked358"){
                return 180
            }
            else if(d.fields.assignee.key == "mab7461"){
                return 320
            }else if(d.fields.assignee.key == "jam7652"){
                return 500
            }else if(d.fields.assignee.key == "admin"){
                return 690
            }


        }).strength(0.05)

        //Force simulation settings for bubbles
        vis.forceXAll = d3.forceX(vis.width/2).strength(0.05)
        var forceCollide = d3.forceCollide(function(d){
            return  vis.radiusScale(d.storyPoints)+2
        })
        vis.simulation = d3.forceSimulation()
            .force("x",vis.forceXAll)
            .force("y",d3.forceY(vis.height/3.5).strength(0.05))
            .force("collide",forceCollide)

        displayStoryPointsLegend(vis);
        vis.wrangleData();
    }

    wrangleData = function (){
        const vis = this;

        // get stories for active sprint
        vis.storiesForSprint = vis.issueStore.selectedSprint.issues;

        //filter out sub-tasks
        vis.storiesForSprint = vis.storiesForSprint.filter(function(d){
            // console.log("subtask",d.fields.issuetype.subtask)
            return d.fields.issuetype.subtask ==false
        });
        //console.log('vis.storiesForSprint',vis.storiesForSprint)

        //update color scale range
        vis.colorScale.range(vis.colorScheme.filter(function (d,i) {
            //needed as the legend needs the domain and range lengths to match
            return i < vis.issueStore.selectedIssueProperty.length;
        }));
        vis.colorScale.domain(vis.issueStore.selectedIssueProperty);

        vis.updateVis();
    }

    updateVis = function (value) {
        var vis = this
        // vis.radiusScale.domain([0, 1, 3, 5, 8, 13, 21])

        displayImagesForScrumTeam(vis);
        displayTitle(vis);

        getImageSVGDef(vis);

        var circles = vis.svgElem.selectAll("circle")
        .data(vis.storiesForSprint)
        .enter().append("circle")
            .attr("class", "bubble")
            .attr("r", d => vis.radiusScale(d.storyPoints))
            .attr("stroke",1)
            .on("click", function (d) {
               $(vis.eventHandler).trigger("scopeBubbleSelectionChanged", d)
            })
        //     .call(d3.drag()
        //         .on("start", (d) => {
        //             if (!d3.event.active) { vis.simulation.alphaTarget(0.2).restart(); }
        //             d.fx = d.x;
        //             d.fy = d.y;
        //         })
        //         .on("drag", (d) => {
        //             d.fx = d3.event.x;
        //             d.fy = d3.event.y;
        //         })
        //         .on("end", (d) => {
        //             if (!d3.event.active) { vis.simulation.alphaTarget(0); }
        //             d.fx = null;
        //             d.fy = null;
        //         })
        //     )
        //     .on ("mouseover",function(d){
        //         d3.select(this).style('stroke', 'black');
        //     })
        //     .on ("mouseout",function(d){
        //     d3.select(this).style('stroke', 'white');
        // });

        vis.svgElem.selectAll(".bubble")
            .attr("fill", function (d) {
                return vis.colorScale(vis.issueStore.getSelectedIssuePropertyValue(d));
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

    }

}

function displayImagesForScrumTeam(vis) {
    var image1 = vis.svgElem.append("image")
        .attr("xlink:href", "img/a.jpg")
        .attr("class", "image")
        .attr("x", 120)
        .attr("y", 270)
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")
        .attr("x", 190)
        .attr("y", 440)
        .attr("stroke", "#8dd3c7")
        .text("Kevin");

    var image2 = vis.svgElem.append("image")
        .attr("xlink:href", "img/b.jpg")
        .attr("class", "image")
        .attr("x", 250)
        .attr("y", 270)
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")
        .attr("x", 320)
        .attr("y", 440)
        .attr("stroke", "#fb8072")
        .text("Manish");
    var image3 = vis.svgElem.append("image")
        .attr("xlink:href", "img/c.jpg")
        .attr("class", "image")
        .attr("x", 420)
        .attr("y", 270)
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")
        .attr("x", 490)
        .attr("y", 440)
        .attr("stroke", "#b3de69")
        .text("James");
    var image4 = vis.svgElem.append("image")
        .attr("xlink:href", "img/d.jpg")
        .attr("class", "image")
        .attr("x", 590)
        .attr("y", 270)
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_original")
        .attr("text-anchor", "middle")
        .attr("x", 660)
        .attr("y", 440)
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
        .attr("y", 470)
        .attr("height", 140)
        .attr("width", 310)
        .style("stroke", "black")
        .style("fill", "none")
        .style("stroke-width", vis.border);
    vis.svgElem.append("text")
        .attr("class", "PT_Serif_Legend")
        // .attr("text-anchor", "end")
        .attr("x", 560)
        .attr("y", 640)
        .attr("stroke", "black")
        // .attr("stroke-width","8px")
        .text("Story Points");
}
