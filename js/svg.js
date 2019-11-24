class Svg {
    constructor(container, width, height, margin) {
        this.margin = margin;
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;
        this.container = container;

        this.svg = d3.select(this.container)
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

    get container(){return this._container;}
    set container(container){this._container = container;}
}

