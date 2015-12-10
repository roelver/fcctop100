API calls
==========

This API provides 2 URLs to retrieve the top 100 user ranking:

/api/fccusers/recent/:sortColumn
/api/fccusers/alltime/:sortColumn

where :sortColumn = [total|community|points|basejumps|ziplines|bonfires|waypoints]


To refresh the user stats, use this API path: 
/api/fccusers/update/:username


Alltime
-------
The alltime API will return a JSON array of 100 objects, containing:

_id		  :	id
username   :	User name on FreeCodeCamp and Github
img        :	URL for the users avatar
total      :	the total score assigned to this user incl. bonus
points     :	the total nomber of points (brownies) excl. bonus
community  :	the number of point not achieved by completing challenges
basejumps  :	the number of completed basejump challenges
ziplines   :	the number of completed zipline challenges
bonfires   :	the number of completed bonfire challenges
waypoints  :	the number of completed waypoint challenges
lastUpdate :	the timestamp of the last update of this user


Recent
-------
The recent API will return a JSON array of 100 objects based on the user's achievements in the past 30 days, containing:

_id		        :	id
username   		  :	User name on FreeCodeCamp and Github
img        		  :	URL for the users avatar
totalRecent      :	the total score assigned to this user incl. bonus
pointsRecent     :	the total nomber of points (brownies) excl. bonus
communityRecent  :	the number of point not achieved by completing challenges
basejumpsRecent  :	the number of completed basejump challenges
ziplinesRecent   :	the number of completed zipline challenges
bonfiresRecent   :	the number of completed bonfire challenges
waypointsRecent  :	the number of completed waypoint challenges
lastUpdateRecent :	the timestamp of the last update of this user

totalRecent : the total score assigned to this user incl. bonus
