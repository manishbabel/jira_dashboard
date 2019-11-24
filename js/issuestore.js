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

class IssueStore {
    constructor(_data) {

        if (_data.issues == null) {
            console.error("Expected issues object");
            return;
        }
        this.issues = _data.issues;

        this.initStore();
    }
    //initialize the IssueStore object
    initStore () {
        const self = this;

        const allSprints = [];
        const sprintMap = [];

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
            setSprintHelperProperties(sprint, self.getIssuesForSprint(sprint));
        });
    };

    getIssuesForSprint (sprint) {
        //look up by passed ID or passed object
        return sprint.id == null ? this.sprintMap[sprint] : this.sprintMap[sprint.id];
    }

    getSprints() {return this.sprints;}
    getIssues(){return this.issues;}

}

function deserializeSprint(s) {
    if (s == null) return null;

    const id= s.match(/id=(\d+)/);
    const rapidViewId= s.match(/rapidViewId=(\d+)/);
    const state = s.match(/state=(\w+)/);
    const name = s.match(/name=(.+),startDate/);
    const startDate = s.match(/startDate=(.+),endDate/);
    const endDate = s.match(/endDate=(.+),completeDate/);
    const completeDate = s.match(/completeDate=(.+),sequence/);
    const sequence = s.match(/sequence=(\d+)/);
    const goal = s.match(/goal=(.+)]/);

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

function setIssueHelperProperties(issue) {
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
