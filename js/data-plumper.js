let sprintField = "customfield_10020";
let endStatus = {
    "self": "https://cs171-jira.atlassian.net/rest/api/3/status/10001",
    "description": "",
    "iconUrl": "https://cs171-jira.atlassian.net/",
    "name": "Done",
    "id": "10001",
    "statusCategory": {
        "self": "https://cs171-jira.atlassian.net/rest/api/3/statuscategory/3",
        "id": 3,
        "key": "done",
        "colorName": "green",
        "name": "Done"
    }
};
let startStatus = {
    "self": "https://cs171-jira.atlassian.net/rest/api/3/status/10000",
    "description": "",
    "iconUrl": "https://cs171-jira.atlassian.net/",
    "name": "To Do",
    "id": "10000",
    "statusCategory": {
        "self": "https://cs171-jira.atlassian.net/rest/api/3/statuscategory/2",
        "id": 2,
        "key": "new",
        "colorName": "blue-gray",
        "name": "To Do"
    }
};
let inProgressStatuses = [
    {
        "self": "https://cs171-jira.atlassian.net/rest/api/3/status/3",
        "description": "This issue is being actively worked on at the moment by the assignee.",
        "iconUrl": "https://cs171-jira.atlassian.net/images/icons/statuses/inprogress.png",
        "name": "In Progress",
        "id": "3",
        "statusCategory": {
            "self": "https://cs171-jira.atlassian.net/rest/api/3/statuscategory/4",
            "id": 4,
            "key": "indeterminate",
            "colorName": "yellow",
            "name": "In Progress"
        }
    },
    {
        "self": "https://cs171-jira.atlassian.net/rest/api/3/status/10012",
        "description": "This status is managed internally by Jira Software",
        "iconUrl": "https://cs171-jira.atlassian.net/",
        "name": "Blocked",
        "id": "10012",
        "statusCategory": {
            "self": "https://cs171-jira.atlassian.net/rest/api/3/statuscategory/2",
            "id": 2,
            "key": "new",
            "colorName": "blue-gray",
            "name": "To Do"
        }
    },
    {
        "self": "https://cs171-jira.atlassian.net/rest/api/3/status/10014",
        "description": "This status is managed internally by Jira Software",
        "iconUrl": "https://cs171-jira.atlassian.net/",
        "name": "In Review",
        "id": "10014",
        "statusCategory": {
            "self": "https://cs171-jira.atlassian.net/rest/api/3/statuscategory/4",
            "id": 4,
            "key": "indeterminate",
            "colorName": "yellow",
            "name": "In Progress"
        }
    }
];

let commentFiller = [
  "Nice",
    "Nice work!",
    "Blocker has been resolved",
    "Code is committed",
    "Code is good",
    "Review complete",
    "We need to check the dependencies",
    "How awesome does that look?",
    "Can you take a look?",
    "Can you take a look at this when you can?",
    "Could this have caused the css bug",
    "You can refer to the link for reference",
    "Refer to the related ticket",
    "The code hasn't been committed yet",
    "Sounds good!",
    "Sounds like a plan",
    "This will be done soon",
    "This should be done tomorrow",
    "This is all set",
    "Moving to next sprint",
    "Created related issue",
    "This needs review",
    "What do you think?",
    "Could this use more clarity?",
    "Is this referring to the new issue in the backlog?",
    "Can you elaborate on what you mean?",
    "What did you mean by that?",
    "This has intruduced a bug",
    "This is in develop",
    "I have created a new branch",
    "This might be more of a bug",
    "Looks great",
    "The code as been merged",
    "The code is in develop",
    "The code is in master",
    "Pull request created",
    "Pull request awaiting sign off",
    "Pull request has been merged",
    "Moving to next sprint",
    "Is this going to be complete by the next sprint?",
    "What is the latest on this?",
    "Is this still needed?",
    "Adding details to story",
    "Added subtasks",
    "Let's exclude this from the submission",
    "This should be done before the linked issue",
    "More detail is needed",
    "Please put this on the left",
    "Testing looks good",
    "We found a bug and have created the linked issue",
    "Reached out in slack about this"
];

function testPlumper(error, jiraData) {
    const issueStore =  new IssueStore(jiraData, "customfield_10020", "customfield_10028" );

    let issues = issueStore.getIssuesForSprint(3);
    console.log(issues[0]);
    plumpIssue(issues[0]);

}

var historyId = 20000;

function plumpIssue(issue) {
    //only plump up the issue if it's Done
    if(issue.fields.status.name != "Cancelled" && issue.fields[sprintField] != null )  {
        var newChangeLog = {"startAt":0};
        var histories = issue.changelog.histories;
        var assignee = issue.fields.assignee;
        //start when the issue was created or when the sprint started if the sprint started after issue was created
        var startDate = issue.fields[sprintField][0].startDate > issue.fields.created ? issue.fields[sprintField][0].startDate : issue.fields.created;
        var endDate = issue.fields.resolutiondate == null? new Date() : issue.fields.resolutiondate;
        //add all change logs but status
        newChangeLog.histories = histories.filter(function (history) {
            var isStatusChange = false;
            history.items.forEach(function (d) {
                if(d.field == "status") isStatusChange = true;
            })
            return !isStatusChange;
        });
        //add status changes
        let timeRange = d3.timeDay.every(1).range(startDate,endDate);
        var previousStatus = startStatus;
        timeRange.forEach(function (day, i) {

            if(i == timeRange.length -1) {
                if(issue.fields.resolutiondate != null) {
                    //it's the last day
                    newChangeLog.histories.push({
                        "id": (historyId++).toString(),
                        "author": assignee,
                        "created": endDate,
                        "items": [{
                            "field": "status",
                            "fieldtype": "jira",
                            "fieldId": "status",
                            "from": previousStatus.id,
                            "fromString": previousStatus.name,
                            "to": endStatus.id,
                            "toString": endStatus.name
                        },
                            {
                                "field": "resolution",
                                "fieldId": "resolution",
                                "fieldtype": "jira",
                                "from": null,
                                "fromString": null,
                                "to": "10000",
                                "toString": "Done"
                            }
                        ]
                    });
                }
            } else {
                //skip a day randomly
                if(Math.floor(Math.random()*5) == 0) return;
                let nextStatus = inProgressStatuses[Math.floor(Math.random()*inProgressStatuses.length)];
                if(nextStatus.name == previousStatus.name) nextStatus = startStatus;
                newChangeLog.histories.push({
                    "id": (historyId++).toString(),
                    "author": assignee,
                    "created": day,
                    "items": [{
                        "field": "status",
                        "fieldtype": "jira",
                        "fieldId": "status",
                        "from": previousStatus.id,
                        "fromString": previousStatus.name,
                        "to": nextStatus.id,
                        "toString": nextStatus.name
                    }]
                });
                previousStatus = nextStatus;
            }

        });

        newChangeLog.maxResults = newChangeLog.histories.length;
        newChangeLog.total = newChangeLog.histories.length;
        issue.changelog = newChangeLog;
    }
};