/**
 * IssueStore functions
 *
 * initStore: process raw Jira data to convert strings to objects and to add helperfunctions to issues and sprints
 * getSprints: returns all sprints
 * getIssues: returns all issues
 * getIssuesForSprint(<sprint object> or <sprint id>): returns all issues associated with a sprint
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
 * state: state of sprint. Either ACTIVE or CLOSED
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

let sprintField = "customfield_10401";
let storyPointField = "customfield_10003";
let parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L%Z");


IssueStore = function(_data){
    if(_data.issues == null ) {
        console.error("Expected issues object");
        return;
    }
    this.issues = _data.issues;

    this.initStore();
};

//initialize the IssueStore object
IssueStore.prototype.initStore = function() {
    var self = this;

    var allSprints = [];
    var sprintMap = [];

    self.issues.forEach(function (issue) {
        var sprints = issue.fields[sprintField];
        if(sprints != null) {
            sprints.forEach(function (sprint, index) {
                var deserializedSprint = deserializeSprint(sprint);
                //update the sprint to be the deserianlized version of the sprint
                issue.fields[sprintField][index] = deserializedSprint;

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
        setIssueHelperProperties(issue);
    });

    self.sprints = allSprints;
    self.sprintMap = sprintMap;

    //setup sprint helper functions
    allSprints.forEach(function (sprint) {
        setSprintHelperProperies(sprint, self.getIssuesForSprint(sprint));
    });
};

IssueStore.prototype.getSprints = function () {
    var self = this;
    return self.sprints;
};

IssueStore.prototype.getIssues = function () {
    var self = this;
    return self.issues;
}

IssueStore.prototype.getIssuesForSprint = function (sprint) {
    var self = this;

    //look up by passed ID or passed object
    return sprint.id == null ? self.sprintMap[sprint] : self.sprintMap[sprint.id];
}

function deserializeSprint(s) {
    if (s == null) return null;

    var id= s.match(/id=(\d+)/);
    var rapidViewId= s.match(/rapidViewId=(\d+)/);
    var state = s.match(/state=(\w+)/);
    var name = s.match(/name=(.+),startDate/);
    var startDate = s.match(/startDate=(.+),endDate/);
    var endDate = s.match(/endDate=(.+),completeDate/);
    var completeDate = s.match(/completeDate=(.+),sequence/);
    var sequence = s.match(/sequence=(\d+)/);
    var goal = s.match(/goal=(.+)]/);

    return { id:id && id[1] ? +id[1] : null,
        rapidViewId: rapidViewId && rapidViewId[1] ? +rapidViewId[1] : null,
        state: state && state[1] ? state[1] : null,
        name: name && name[1] ? name[1] : null,
        startDate:startDate && startDate[1] ? parseDate(startDate[1]) : null,
        endDate:endDate && endDate[1] ? parseDate(endDate[1]) : null,
        completeDate:completeDate && completeDate[1] ? parseDate(completeDate[1]) : null,
        sequence:sequence && sequence[1] ? +sequence[1] : null,
        goal:goal && goal[1] ? goal[1] : null
    };
}

function deserializeIssueDates(issue) {
    issue.fields.created = parseDate(issue.fields.created);
    issue.fields.updated = parseDate(issue.fields.updated);
    issue.fields.resolutiondate = parseDate(issue.fields.resolutiondate);
}

function setIssueHelperProperties(issue) {
    issue.storyPoints =  issue.fields[storyPointField] != null ? issue.fields[storyPointField] : 0 ;
    issue.isResolved = issue.fields["resolution"] != null;
}

function setSprintHelperProperies(sprint, sprintIssues) {
    var self = this;
    var storyPoints = 0;
    var completedStoryPoints = 0;
    sprintIssues.forEach(function (issue) {
        storyPoints += issue.storyPoints;
        //we want to use completedDate if available
        var completedDate = sprint.completeDate != null ? sprint.completeDate : sprint.endDate;
        if(issue.fields.resolutiondate != null && issue.fields.resolutiondate <= completedDate) {
            completedStoryPoints += issue.storyPoints;
        }
    });

    sprint.totalStoryPoints = storyPoints;
    sprint.completedStoryPoints = completedStoryPoints;
}
