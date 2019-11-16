class ScrumProcess {
    constructor(data) {
        this._data = data;
        this.setOverviewText();
    }

    setOverviewText() {
        document.querySelector("#overview").innerText = this.data["overview"];
    }

    get data(){return this._data;}
}

