//Main page controller class
class ScrumProcess {
    constructor(data, actionMapping) {
        this._data = data;
        this._actionMapping = actionMapping;

        this.setText();
        this.setClickHandlers();
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
            this.data.general["sprint"];

    }

    setClickHandlers(){

        const visualizations = document.querySelectorAll(".viz");
        visualizations.forEach( viz => { viz.style.display = "none"; });

        //The element clicked is the key
        //The viz object to display is the value
        Object.keys(this.actionMapping)
            .forEach( key => {

                const visContainerSelector = this.actionMapping[key].svg.container;

                document.querySelector(key).onclick = () => {
                    const visualizations = document.querySelectorAll(".viz");
                    visualizations.forEach( viz => { viz.style.display = "none"; });

                    document.querySelector(visContainerSelector).style.display = "block";
                }
            });
    }

    get data(){return this._data;}
    get actionMapping(){return this._actionMapping;}

}

