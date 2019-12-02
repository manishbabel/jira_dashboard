/**
 * IssueStore functions
 *
 * initStore: process raw Jira data to convert strings to objects and to add helperfunctions to issues and sprints
 * getSprints: returns all sprints
 * getIssues: returns all issues
 * getIssuesForSprint(<sprint object> or <sprint id>): returns all issues associated with a sprint
 * getBacklogUrl: returns the url for the backlog in Jira
 * getStoryPointField: returns the field ID (string) of the field used for story points. Example: customfield_10003
 * getSprintUrlForSprint(<sprint object> or <sprint id>): returns the url of the sprint in Jira
 */

/**
 * Sprint properties
 *
 * id: id of the sprint
 * rapidViewId: id of the Jira board that the sprint was created in
 * completeDate: date object of date sprint was completed
 * endDate: date object of date sprint is scheduled to end
 * startDate: date object of date sprint is scheduled to start (or actually started?)
 * goal: optional string of the goal of the sprint. Example "focus on tech debt"
 * name: name of sprint
 * sequence: positioning of sprint in the board (relative to other sprints)
 * state: state of sprint. Either ACTIVE, CLOSED, or FUTURE
 * totalStoryPoints: generated property for sum of story points of all issues in the sprint
 * completedStoryPoints: generated property for sum of story points for COMPLETED issues in the sprint
 */

/**
 * Issue properties
 *
 * This is not an exhaustive list.
 *
 * id: id of the sprint. This is not recognizable to users, use key for display
 * key: Jira key of the issue. <project key>-<number (not id)> Example: CFX-123
 * storyPoints: story points of issue. Will always be initialized to 0
 * isResolved: boolean of if issue is resolved or unresolved
 * fields.reporter.displayName: display name of the reporter of the issue
 * fields.assignee.displayName: display name of the assignee of the issue. May be null
 * fields.priority.name: name of issue's current priority
 * fields.status.name: name of issue's current status
 * fields.summary: summary of the issue (display name of the issue)
 * fields.created: date object of created date
 * fields.resolutiondate: date object of created date. May be null
 * fields.updated: date object of updated date (when anything was last done to the issue including transitioning or edits)
 * fields.description: descroption of the issue
 * fields.issuetype.name: name of the issue type
 *
 */

const defaultSprintField = "customfield_10401";
const defaultStoryPointField = "customfield_10003";
const jiraBaseUrl = "https://cs171-jira.atlassian.net/";
//count metrics
const totalStoryPoints = "totalSprintStoryPoints";
const completedStoryPoints = "completedSprintStoryPoints";
const issueCount = "issueSprintCount";

//layers
const priorityLayer = "priority";
const issueTypeLayer = "issueType";
const componentLayer = "components";
let parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L%Z");

class IssueStore {
    constructor(_data, _sprintField, _storyPointField) {

        if (_data.issues == null) {
            console.error("Expected issues object");
            return;
        }
        this.issues = _data.issues;
        this.sprintField = typeof _sprintField !== 'undefined' ? _sprintField : defaultSprintField;
        this.storyPointField = typeof _storyPointField !== 'undefined' ? _storyPointField : defaultStoryPointField;

        this.initStore();
    }
    //initialize the IssueStore object
    initStore () {
        const self = this;

        const allSprints = [];
        const sprintMap = [];
        var priorities = [];
        var priorityIds = [];
        var issueTypeIds = [];
        var issueTypes = [];
        var componentIds = [];
        var components = ["None"];

        self.issues.forEach(function (issue) {
            var sprints = issue.fields[self.sprintField];
            if(sprints != null) {
                sprints.forEach(function (sprint, index) {
                    var deserializedSprint = deserializeSprint(sprint);
                    //update the sprint to be the deserianlized version of the sprint
                    issue.fields[self.sprintField][index] = deserializedSprint;

                    //If this is the first time seeing a particular sprint
                    if (! sprintMap[deserializedSprint.id]) {
                        sprintMap[deserializedSprint.id] = [];
                        allSprints.push(deserializedSprint);
                    }

                    //add this issue to the sprint
                    sprintMap[deserializedSprint.id].push(issue);
                });
            }
            //deserialize dates
            deserializeIssueDates(issue);
            //setup issue helper functions
            setIssueHelperProperties(issue, self.storyPointField);

            //get all possible values for priority, issuetype, and component
            if(! priorityIds[issue.fields.priority.id]) {
                priorities.push(issue.fields.priority.name);
                priorityIds[issue.fields.priority.id] = issue.fields.priority.name;
            }
            if(! issueTypeIds[issue.fields.issuetype.id]) {
                issueTypes.push(issue.fields.issuetype.name);
                issueTypeIds[issue.fields.issuetype.id] = issue.fields.issuetype.name;
            }

            issue.fields.components.forEach(function (component) {
                if(! componentIds[component.id]) {
                    components.push(component.name);
                    componentIds[component.id] = component.name;
                }
            });

        });

        self.sprints = allSprints;
        self.sprintMap = sprintMap;
        self.priorities = priorities;
        self.issueTypes = issueTypes;
        self.components = components;

        //setup sprint helper functions and data beakdown



        allSprints.forEach(function (sprint) {
            var sprintIssues = self.getIssuesForSprint(sprint);
            setSprintHelperProperties(sprint, sprintIssues);
            sprint.issues = sprintIssues;

            //calculate sum of story points per sprint
            sprint[totalStoryPoints] = {};
            sprint[totalStoryPoints][priorityLayer] = {};
            sprint[totalStoryPoints][componentLayer] = {};
            sprint[totalStoryPoints][issueTypeLayer] = {};
            sprint[issueCount] = {};
            sprint[issueCount][priorityLayer] = {};
            sprint[issueCount][componentLayer] = {};
            sprint[issueCount][issueTypeLayer] = {};
            sprint[completedStoryPoints] = {};
            sprint[completedStoryPoints][priorityLayer] = {};
            sprint[completedStoryPoints][componentLayer] = {};
            sprint[completedStoryPoints][issueTypeLayer] = {};

            priorities.forEach(function (priority) {

                sprint[priority] = 0; //TODO remove this
                sprint[totalStoryPoints][priorityLayer][priority] = 0;
                sprint[completedStoryPoints][priorityLayer][priority] = 0;
                sprint[issueCount][priorityLayer][priority] = 0;
            });
            issueTypes.forEach(function (issueType) {
                sprint[totalStoryPoints][issueTypeLayer] [issueType] = 0;
                sprint[completedStoryPoints][issueTypeLayer] [issueType] = 0;
                sprint[issueCount][issueTypeLayer][issueType] = 0;
            });

            components.forEach(function (component) {
                sprint[totalStoryPoints][componentLayer][component] = 0;
                sprint[completedStoryPoints][componentLayer][component] = 0;
                sprint[issueCount][componentLayer][component] = 0;
            });
            sprint.issues.forEach(function (issue) {
                sprint[issue.fields.priority.name] += issue.storyPoints; //TODO remove
                //Total Story Points
                sprint[totalStoryPoints][priorityLayer][issue.fields.priority.name] += issue.storyPoints;
                sprint[totalStoryPoints][issueTypeLayer][issue.fields.issuetype.name] += issue.storyPoints;

                //Completed Story Points
                if(issue.isResolved) {
                    sprint[completedStoryPoints][priorityLayer][issue.fields.priority.name] += issue.storyPoints;
                    sprint[completedStoryPoints][issueTypeLayer][issue.fields.issuetype.name] += issue.storyPoints;
                }

                //Issue Count
                sprint[issueCount][priorityLayer][issue.fields.priority.name] += 1
                sprint[issueCount][issueTypeLayer][issue.fields.issuetype.name] += 1;

                //Components
                if(issue.fields.components.length == 0) {
                    sprint[totalStoryPoints][componentLayer]["None"] += issue.storyPoints;
                    if(issue.isResolved) sprint[completedStoryPoints][componentLayer]["None"] += issue.storyPoints;
                    sprint[issueCount][componentLayer]["None"] += 1;
                } else {
                    issue.fields.components.forEach(function (component) {
                        sprint[totalStoryPoints][componentLayer][component.name] += issue.storyPoints;
                        if(issue.isResolved) sprint[completedStoryPoints][componentLayer][component.name] += issue.storyPoints;
                        sprint[issueCount][componentLayer][component.name] += 1;
                    })
                }
            });
            if(sprint.state == "ACTIVE") self.activeSprint = sprint;
        });

        self.selectedIssueProperty = self.priorities;
    };

    get priorities() { return this._priorities;}
    set priorities(priorities) {this._priorities = priorities;}
    get issueTypes() { return this._issueTypes;}
    set issueTypes(issueTypes) {this._issueTypes = issueTypes;}
    get components() { return this._components;}
    set components(components) {this._components = components;}
    get selectedIssueProperty() {return this._selectedIssueProperty;}
    set selectedIssueProperty(selectedIssueProperty) {this._selectedIssueProperty = selectedIssueProperty;}

    getIssuesForSprint (sprint) {
        //look up by passed ID or passed object
        return sprint.id == null ? this.sprintMap[sprint] : this.sprintMap[sprint.id];
    }

    getSprints() {return this.sprints;}
    getIssues(){return this.issues;}
    getStoryPointField(){return this.storyPointField;}
    getBacklogUrl(){
        if (this.sprints.length <1) return jiraBaseUrl;
        else return jiraBaseUrl + "secure/RapidBoard.jspa?view=planning.nodetail&rapidView=" + this.sprints[0].rapidViewId;
    }
    getSprintUrlForSprint(sprint){
        var sprintId;

        if(! isNaN(sprint)) sprintId = sprint;
        else if (sprint.id != null) sprintId = sprint.id;
        else return jiraBaseUrl;

        const sprintObj = this.getSprints().find(function (d) {
            return d.id == sprintId;
        });

        if (sprintObj == null) return jiraBaseUrl;

        switch (sprintObj.state) {
            case "FUTURE":
                return jiraBaseUrl + "secure/RapidBoard.jspa?view=planning.nodetail&rapidView=" + sprintObj.rapidViewId;
                break;
            case "ACTIVE":
                return jiraBaseUrl + "secure/RapidBoard.jspa?rapidView=" + sprintObj.rapidViewId;
                break;
            case "CLOSED":
                return jiraBaseUrl + "secure/RapidBoard.jspa?rapidView="+ sprintObj.rapidViewId
                    + "&view=reporting&chart=sprintRetrospective&sprint=" + sprintObj.id;
                break;
        }
    }

    onSelectedIssuePropertyChange (selection) {
        switch(selection) {
            case "priorities":
                this.selectedIssueProperty = this.priorities;
                break;
            case "components":
                this.selectedIssueProperty = this.components;
                break;
            case "issueType":
                this.selectedIssueProperty = this.issueTypes;
                break;
        }
    }

}

function deserializeSprint(s) {
    if (s == null) return null;

    var sprintData = s.match(/com.atlassian.greenhopper.service.sprint.Sprint@.*\[id=(\d+),rapidViewId=(\d+),state=([A-Z]+),name=(.*),goal=(.*),startDate=(.*),endDate=(.*),completeDate=(.*),sequence=(\d+)\]/);
    if (sprintData != null) {
        return { id: sprintData[1] != null ? +sprintData[1] : null,
            rapidViewId: sprintData[2] != null ? +sprintData[2] : null,
            state: sprintData[3] != null ? sprintData[3] : null,
            name: sprintData[4] != null ? sprintData[4] : null,
            goal: sprintData[5] != null && sprintData[5].length != 0 ? sprintData[5] : null,
            startDate: sprintData[6] != null ? parseDate(sprintData[6]) : null,
            endDate: sprintData[7] != null ? parseDate(sprintData[7]) : null,
            completeDate: sprintData[8] != null ? parseDate(sprintData[8]) : null,
            sequence: sprintData[9] != null ? +sprintData[9] : null
        };
    }
    sprintData = s.match(/com.atlassian.greenhopper.service.sprint.Sprint@.*\[id=(\d+),rapidViewId=(\d+),state=([A-Z]+),name=(.*),startDate=(.*),endDate=(.*),completeDate=(.*),sequence=(\d+),goal=(.*)\]/);
    if (sprintData != null) {

        return { id: sprintData[1] != null ? +sprintData[1] : null,
            rapidViewId: sprintData[2] != null ? +sprintData[2] : null,
            state: sprintData[3] != null ? sprintData[3] : null,
            name: sprintData[4] != null ? sprintData[4] : null,
            startDate: sprintData[5] != null ? parseDate(sprintData[5]) : null,
            endDate: sprintData[6] != null ? parseDate(sprintData[6]) : null,
            completeDate: sprintData[7] != null ? parseDate(sprintData[7]) : null,
            sequence: sprintData[8] != null ? +sprintData[8] : null,
            goal: sprintData[9] != null && sprintData[9].length != 0 ? sprintData[9] : null
        };
    }
    if(sprintData == null) {
        console.log("fake!!");
        console.log(s);
        return null;
    }
}

function deserializeIssueDates(issue) {
    issue.fields.created = parseDate(issue.fields.created);
    issue.fields.updated = parseDate(issue.fields.updated);
    issue.fields.resolutiondate = parseDate(issue.fields.resolutiondate);
	//changelog
	if(issue.changelog) issue.changelog.histories.forEach(function(history) {
		history.created = parseDate(history.created);
	});
	//comments
	issue.fields.comment.comments.forEach((comment) => {
		comment.created = parseDate(comment.created);
		comment.updated = parseDate(comment.updated);
		
	});
	
}

function setIssueHelperProperties(issue, storyPointField) {
    issue.storyPoints =  issue.fields[storyPointField] != null ? issue.fields[storyPointField] : 0 ;
    issue.isResolved = issue.fields["resolution"] != null;
}

function setSprintHelperProperties(sprint, sprintIssues) {
    let storyPoints = 0;
    let completedStoryPoints = 0;
    let blockers = 0;
    sprintIssues.forEach(function (issue) {
        storyPoints += issue.storyPoints;
        //we want to use completedDate if available
        const completedDate = sprint.completeDate != null ? sprint.completeDate : sprint.endDate;
        if(issue.fields.resolutiondate != null && issue.fields.resolutiondate <= completedDate) {
            completedStoryPoints += issue.storyPoints;
        }

        if (issue.fields.status.name == "Blocked") {
            blockers += 1;
        }
    });

    sprint.totalStoryPoints = storyPoints;
    sprint.completedStoryPoints = completedStoryPoints;
    sprint.totalBlockers = blockers;
}
