
var dateFormatter = d3.timeFormat("%Y-%m-%d");
var dateParser = d3.timeParse("%Y-%m-%d");


EmployeeDetailsChart = function(_parentElement, _data){
    this.parentElement = _parentElement
    this.data = _data
    this.displayData = []
    this.initVis()
}

EmployeeDetailsChart.prototype.initVis = function (){
    var vis = this;

    vis.margin = { top: 20, right: 20, bottom: 200, left: 60 };

    vis.width = 960 - vis.margin.left - vis.margin.right,
        vis.height = 200 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

}
EmployeeDetailsChart.prototype.wrangleData = function (d){

    console.log("employee",d)
    var vis = this
    vis.text_val  = "Hello ! I am "+d.fields.assignee.displayName+" This story is about" +d.fields.description
    vis.changelog = d['changelog']['histories']
    vis.dataset = []
    vis.changelog.forEach(function(d){
        var date1 =d.created
        console.log((date1))
        var myTime = String(date1).substr(16, 2);
        console.log(dateFormatter(new Date(date1)),myTime)

        vis.dataset.push({desc:d.items[0].field +":"+d.items[0].toString,fulldate:d.created,date: (new Date(date1)),time:myTime})
    })
    vis.updateVis()



}
EmployeeDetailsChart.prototype.updateVis = function (value){
    var vis = this


    var image = vis.svg.append("image")
        .attr("xlink:href", "img/1.png")
        .attr("class","image")
        .attr("x",-60)
        .attr("y",-20)

    function stylist_note_typing_animation(progress){
        // console.log("adsdasds")

        var text_progress = Math.max(0,
            Math.min( vis.text_val.length + 1,
                Math.floor(progress * vis.text_val.length)))

        vis.svg.append("text")
            .attr("x", 270)
            .attr("y", 50   )
            .text(vis.text_val.substring(0, text_progress));
   }

    var progress = 0
    d3.interval(function(){
        var r = Math.random()
        if (r < 0.8) {
            if ((r < 0.1) && (progress > 0.2)) {
                progress -= 0.01
            } else {
                progress += 0.01
            }
            stylist_note_typing_animation(progress)
        }
    }, 50)


}

EmployeeDetailsChart.prototype.onSelectionChange = function(d){
    var vis = this;
    console.log("e",d)
    //
    // console.log(selectionEnd)
    // Filter original unfiltered data depending on selected time period (brush)

    // *** TO-DO ***
    // vis.filteredData = vis.data.filter(function(d) {
    //     return d.time >= selectionStart && d.time <= selectionEnd
    // })

    vis.wrangleData(d);
}