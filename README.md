# ScrumSee

ScrumSee is a novel dashboard visualization that guides you through the process of Agile Scrum by visualizing how your
Jira data fits into the Scrum model while learning about Scrum and best practices along the way.

## Jira

Jira is an industry leading project management software suite that enables development teams to practice Agile Scrum.
More information: https://www.atlassian.com/software/jira

## Contents

We will explain the structure of our repository and the important files within.

### index.html

This HTML file is the primary display of our work.  It sources all of the Javascript and CSS files that comprise our 
visualizations. Open this in your browser.


### js/

This directory contains all of the Javascript code that was written for the project. `main.js`
is the primary script which loads the data and creates instances of the visualization scripts 
defined in the other Javascript files.

Within the `lib/` subdirectory are the Javascript libraries that were also used for this project. 

### data/

This directory contains all of the Jira data which was used for the visualization. 

CFX-data-scrubbed.json and all JV-xx-xx-19.json files are exports of Jira data coming straight from the api. 
CFX-data-scrubbed.json was the original data but as this development team used Jira, there was enough data to start 
pulling from the Jira project used to manage this project.

To view the Jira site, go to https://cs171-jira.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=JV .
You must sign in using an @g.harvard.edu email.

The json file used in the website is JV-12-7-19.json . If converted to a NodeJs application, this visualization could
pull live Jira Data.

### img/

This directory contains images that were used in the dashboard.
 
## Acknowledgements

* Hotspots code inspired and adapted from https://codepen.io/jack-taylor89/pen/JeajeL?editors=1100
* `scrum-main.png` inspired and adapted from https://www.verbindungszentrum.com/scrum-en/
* https://www.w3schools.com/css/tryit.asp?filename=trycss_tooltip_arrow_top
* `reset.css` from http://meyerweb.com/eric/tools/css/reset/
* https://wesbos.com/template-strings-html/ 
* https://tntvis.github.io/tnt.tooltip/
* https://codepen.io/ashokgowtham/pen/LpnHe 
* https://www.d3-graph-gallery.com/graph/line_cursor.html
* https://d3-legend.susielu.com/
* https://github.com/d3/d3/wiki/Gallery
* https://vallandingham.me/bubble_charts_in_d3.html
* http://dimplejs.org/advanced_examples_viewer.html?id=advanced_time_axis

## Website
https://manishbabel.github.io/jira_dashboard/

## Video
Intro: https://www.youtube.com/watch?v=BbnWgeNTiy0
2min feature overview: https://www.youtube.com/watch?v=0Xa_DAD3ay0

## Code
https://github.com/manishbabel/jira_dashboard