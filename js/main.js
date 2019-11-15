class Data {
    constructor () {

        queue()
            .defer(d3.json, "data/jira-data-1.json")
            .defer(d3.json, "data/scrum-process.json")
            .defer(d3.json, "data/retrospective.json")
            .await(this.wrangleData);
    }

    wrangleData(error, jiraStories, scrumText, retrospective) {

        jiraStories.forEach(d => {
            //d.field1 = +d.field1;
        });

        retrospective.forEach(d => {
            //d.field1 = +d.field1;
        });

        this._jiraStories = jiraStories;
        this._scrumText = scrumText;
        this._retrospective = retrospective;
    }

    get jiraStories(){return this._jiraStories;}
    set jiraStories(jiraStories){this._jiraStories = jiraStories;}

    get scrumText(){return this._scrumText;}
    set scrumText(scrumText){this._scrumText = scrumText;}

    get retrospective(){return this._retrospective;}
    set retrospective(retrospective){this._retrospective = retrospective;}
}

document.addEventListener("DOMContentLoaded", () => {

    const data = new Data();

});




