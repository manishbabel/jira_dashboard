class ScopeDetailChart {
    constructor(data, svg) {
        this._data = data;
        this._svg = svg;
    }

    get data(){return this._data;}
    get svg(){return this._svg;}
}