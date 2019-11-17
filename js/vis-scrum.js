class ScrumProcess {
    constructor(data) {
        this._data = data;
        this.setText();
    }

    setText() {
        document.querySelector("#content-po p").innerText =
            this.data.roles["product-owner"];

        document.querySelector("#content-sm p").innerText =
            this.data.roles["scrum-master"];

        document.querySelector("#content-tm p").innerText =
            this.data.roles["team-member"];

        document.querySelector("#content-showcase p").innerText =
            this.data.ceremonies["showcase"];

        document.querySelector("#content-retrospective p").innerText =
            this.data.ceremonies["retrospective"];

        document.querySelector("#content-daily-scrum p").innerText =
            this.data.ceremonies["daily-scrum"];

        document.querySelector("#content-product-backlog p").innerText =
            this.data.artifacts["product-backlog"];

        document.querySelector("#content-sprint-backlog p").innerText =
            this.data.artifacts["sprint-backlog"];

        document.querySelector("#content-product-increment p").innerText =
            this.data.artifacts["product-increment"];

        document.querySelector("#content-sprint p").innerText =
            this.data.artifacts["sprint"];

    }
    get data(){return this._data;}
}

