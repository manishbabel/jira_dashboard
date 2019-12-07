//Main page controller class
class ScrumProcess {
    constructor(issueStore, scrumTextStore, retroStore, actionMapping) {
        this._scrumTextStore = scrumTextStore;
        this._issueStore = issueStore;
        this._retroStore = retroStore;
        this._actionMapping = actionMapping;

        this.populateSprintSelector();
        this.setStats();
        this.setText();
        this.setClickHandlers();
    }

    populateSprintSelector() {
        const selectorElem = document.querySelector("#sprint-selector");

        const sprints = this.issueStore.getSprints();
        sprints.forEach((sprint)=> {
            const optionElement = document.createElement("option");
            optionElement.value= sprint.id;
            selectorElem.appendChild(optionElement);

            let sprintName = sprint.name;
            if (sprint.state == "ACTIVE") {
                sprintName += " - Active Sprint";
                selectorElem.value = sprint.id;
            }
            optionElement.innerHTML = sprintName;

        })
    }

    getSprintDaysHTML(sprint){
        const sprintStart = sprint.startDate;
        const sprintEnd = sprint.endDate;
        const sprintLength = Math.ceil((sprintEnd.getTime() - sprintStart.getTime()) / (1000*60*60*24));
        const currentDay = new Date();
        const dayOfSprint = Math.ceil((currentDay.getTime() - sprintStart.getTime()) / (1000*60*60*24));

        return "Sprint Day " + dayOfSprint + " of " + sprintLength +
            "<br>Ends " + formatDate(sprintEnd) +
            "<br><i class='fas fa-arrow-circle-down'></i>";
    }

    setStats(){
        const activeSprint = this.issueStore.activeSprint;
        const velocity = this.issueStore.previousSprint.completedStoryPoints;
        const committed = activeSprint.totalStoryPoints;
        const completed = activeSprint.completedStoryPoints;
        const burndownPct =  parseFloat(100 * completed / committed).toFixed()+"%";
        const backlogStoryCount = this.issueStore.getIssues().length;
        const averageHappiness = this.retroStore.getSprintHappiness(activeSprint);
        const totalAlerts = activeSprint.totalAlerts;

        const arrow = "<i class='fas fa-angle-double-right'></i>";

        document.querySelector("#b-sprint").innerHTML = this.getSprintDaysHTML(activeSprint);
        document.querySelector("#scrum-velocity").innerText = velocity + " story points";
        document.querySelector("#scrum-burndown-pct").innerText = burndownPct;
        document.querySelector("#burn-down-progress").style = "width: " + burndownPct;
        document.querySelector("#total-blockers").innerText = activeSprint.totalBlockers;
        document.querySelector("#sprint-goal").innerText = activeSprint.goal;
        document.querySelector("#b-sprint-backlog").innerHTML = "Sprint Backlog <br>" + committed + " points <br>";
        document.querySelector("#b-product-increment").innerHTML = "Product Increment <br>" + completed + " points <br>";
        document.querySelector("#b-product-backlog").innerHTML = "Product Backlog <br>" + backlogStoryCount + " stories <br>";
        document.querySelector("#b-sprint-planning").innerHTML = "Sprint Planning <br>" + totalAlerts + " unestimated <br> stories<br><i class='fas fa-arrow-circle-down'></i>";
        const retroElem = document.querySelector("#b-retrospective");
        retroElem.innerHTML = "&nbsp&nbsp" + averageHappiness.toFixed(2);

        if (averageHappiness < 0){
           retroElem.className += " fa-sad-tear";
           retroElem.style.color = "darkred";
        } else {
            retroElem.className += " fa-smile-beam";
            retroElem.style.color = "darkgreen";
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
        document.querySelector("#sprint-selector").onchange = () => {
            $(eventHandler).trigger("selectedSprintChange", d3.select("#sprint-selector").property("value"));
        };

        document.querySelector("#b-product-backlog").onclick = () => {
            window.open("https://cs171-jira.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=JV&view=planning&selectedIssue=JV-122&epics=visible", "_blank")
        };

        document.querySelector("#b-product-increment").onclick = () => {
            window.open("https://cs171-jira.atlassian.net/issues/?jql=project%20%3D%20JV%20and%20status%20%3D%20Done%20and%20sprint%3D5", "_blank")
        };

        document.querySelector("#b-sprint-backlog").onclick = () => {
            window.open("https://cs171-jira.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=JV", "_blank")
        };

        document.querySelector("#velocity-card").onclick = () => {
            window.open("https://cs171-jira.atlassian.net/secure/RapidBoard.jspa?projectKey=JV&rapidView=1&view=reporting&chart=velocityChart", "_blank")
        };

        const activeSprint = this.issueStore.activeSprint;
        document.querySelector("#burn-down-card").onclick = () => {
            window.open("https://cs171-jira.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=JV&view=reporting&chart=burndownChart&sprint=" + activeSprint.id, "_blank")
        };

        document.querySelector("#blockers-card").onclick = () => {
            window.open("https://cs171-jira.atlassian.net/issues/?jql=project%20%3D%20JV%20and%20status%20%3D%20Blocked%20and%20sprint%3D" + activeSprint.id, "_blank")
        };

        const visualizations = document.querySelectorAll(".viz");
        visualizations.forEach( viz => { viz.style.display = "none";});

        const actionMapping = this.actionMapping;

        //Set a click handler on every main page element with an action mapping
        Object.keys(actionMapping).forEach(clickedId => {

            document.querySelector(clickedId).onclick = () => {

                //Hide all visualizations and selectors
                const vizContainerElements = document.querySelectorAll(".viz");
                vizContainerElements.forEach(vizContainerElem => {
                    vizContainerElem.style.display = "none";
                });

                const vizSelectorElements = document.querySelectorAll(".scrum-selector");
                vizSelectorElements.forEach(vizSelectorElem => {
                    vizSelectorElem.style.display = "none";
                });

                //Display the visualizations mapped to the clicked on element
                actionMapping[clickedId].forEach(vizObj => {
                    const visContainerSelector = vizObj.svg.container;
                    document.querySelector(visContainerSelector).style.display = "block";

                    if (visContainerSelector == "#employee-chart") vizObj.employeeChart.updateVis();
                    else if(visContainerSelector == "#scope-chart") {
                        document.querySelectorAll(".scope-selector").forEach(element => {
                            element.style.display = "block";
                        });
                        $(eventHandler).trigger("selectedVisualizationChange", "scope-visualization");

                    } else if(visContainerSelector == "#velocity-chart") {
                        document.querySelectorAll(".velocity-selector").forEach(element => {
                            element.style.display = "block";
                        });
                        $(eventHandler).trigger("selectedVisualizationChange", "velocity-visualization");
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

