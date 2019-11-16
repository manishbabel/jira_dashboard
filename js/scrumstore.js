class ScrumTextStore {
    constructor(data) {
    this._data = data;
    }

    get data(){return this._data;}
    get overview(){return this.data.overview;}
    get ceremonies(){return this.data.ceremonies;}
    get roles(){return this.data.roles;}
    get artifacts(){return this.data.artifacts;}

}

