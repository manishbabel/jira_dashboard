//Main page controller class
class ScrumProcess {
    constructor(issueStore, scrumTextStore, retroStore, actionMapping) {
        this._scrumTextStore = scrumTextStore;
        this._issueStore = issueStore;
        this._retroStore = retroStore;
        this._actionMapping = actionMapping;

        this.setStats();
        this.setText();
        this.setClickHandlers();
    }

    setStats(){

        const sprints = this.issueStore.getSprints();
        const activeSprint = sprints.filter(d => d.state == "ACTIVE")[0];
        const committed = activeSprint.totalStoryPoints;
        const completed = activeSprint.completedStoryPoints;
        const burndownPct =  parseFloat(100 * completed / committed).toFixed()+"%";
        const backlogStoryCount = this.issueStore.getIssues().length;
        const averageHappiness = this.retroStore.getSprintHappiness(activeSprint);

        document.querySelector("#scrum-velocity").innerText = committed + " story points";
        document.querySelector("#scrum-burndown-pct").innerText = burndownPct;
        document.querySelector("#burn-down-progress").style = "width: " + burndownPct;
        document.querySelector("#total-blockers").innerText = activeSprint.totalBlockers;
        document.querySelector("#sprint-goal").innerText = activeSprint.goal;
        document.querySelector("#b-sprint-backlog").innerText = committed + " points";
        document.querySelector("#b-product-increment").innerText = completed + " points";
        document.querySelector("#b-product-backlog").innerText = backlogStoryCount + " stories";
        const retroElem = document.querySelector("#b-retrospective")
        retroElem.innerText += averageHappiness.toFixed(2);

        if (averageHappiness < 0){
           retroElem.className += " fa-sad-tear";
        } else {
            retroElem.className += " fa-smile-beam";
        }
    }

    setText() {
        document.querySelector("#content-po p").innerText =
            this.scrumTextStore.data.roles["product-owner"];

        document.querySelector("#content-sm p").innerText =
            this.scrumTextStore.data.roles["scrum-master"];

        document.querySelector("#content-tm p").innerText =
            this.scrumTextStore.data.roles["team-member"];

        document.querySelector("#content-showcase p").innerText =
            this.scrumTextStore.data.ceremonies["showcase"];

        document.querySelector("#content-retrospective-desc p").innerText =
            this.scrumTextStore.data.ceremonies["retrospective"];

        document.querySelector("#content-daily-scrum p").innerText =
            this.scrumTextStore.data.ceremonies["daily-scrum"];

        document.querySelector("#content-sprint-planning-desc p").innerText =
            this.scrumTextStore.data.ceremonies["sprint-planning"];

        document.querySelector("#content-product-backlog-desc p").innerText =
            this.scrumTextStore.data.artifacts["product-backlog"];

        document.querySelector("#content-sprint-backlog-desc p").innerText =
            this.scrumTextStore.data.artifacts["sprint-backlog"];

        document.querySelector("#content-product-increment-desc p").innerText =
            this.scrumTextStore.data.artifacts["product-increment"];

        document.querySelector("#content-sprint-desc p").innerText =
            this.scrumTextStore.data.general["sprint"];
    }

    setClickHandlers() {

        document.querySelector("#b-product-backlog").onclick = () => {
            window.open("https://cs171-jira.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=JV&view=planning&selectedIssue=JV-122&epics=visible", "_blank")
        };

        const visualizations = document.querySelectorAll(".viz");
        visualizations.forEach( viz => { viz.style.display = "none";});

        const actionMapping = this.actionMapping;

        //Set a click handler on every main page element with an action mapping
        Object.keys(actionMapping).forEach(clickedId => {

            document.querySelector(clickedId).onclick = () => {

                //Hide all visualizations
                const vizContainerElements = document.querySelectorAll(".viz");
                vizContainerElements.forEach(vizContainerElem => {
                    vizContainerElem.style.display = "none";
                });

                //Display the visualizations mapped to the clicked on element
                actionMapping[clickedId].forEach(vizObj => {
                    const visContainerSelector = vizObj.svg.container;
                    document.querySelector(visContainerSelector).style.display = "block";

                    if (visContainerSelector == "#employee-chart") {
                        vizObj.employeeChart.updateVis();
                    }
                });
            }
        });
    }
    get issueStore(){return this._issueStore;}
    get scrumTextStore(){return this._scrumTextStore;}
    get retroStore(){return this._retroStore;}
    get actionMapping(){return this._actionMapping;}

}

