class ScopeChart {
    constructor(data, svg, visScopeDetail) {
        this._data = data;
        this._svg = svg;
        this._visScopeDetail = visScopeDetail;
    }

    get data(){return this._data;}
    get svg(){return this._svg;}
    get visScopeDetail(){return this._visScopeDetail;}
}