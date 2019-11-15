class Svg {
    constructor(container,width, height) {
        this.margin = {top: 0, right: 0, bottom: 0, left: 0};
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;

        this.svg = d3.select(container)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g")
            .attr("class", "main-group")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    }

    get g(){return this.svg.select('.main-group');}

    get svg(){return this._svg;}
    set svg(svg){this._svg = svg;}

    get width(){return this._width;}
    set width(width){this._width = width;}

    get height(){return this._height;}
    set height(height){this._height = height;}

    get margin(){return this._margin;}
    set margin(margin){this._margin = margin;}
}

