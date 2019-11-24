class ScrumTextStore {
    constructor(data) {
        this._data = data;
    }

    get data(){return this._data;}
    get ceremonies(){return this.data.ceremonies;}
    get roles(){return this.data.roles;}
    get artifacts(){return this.data.artifacts;}
    get general(){return this.data.general;}

}

