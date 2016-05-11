# Sheriff-Sales

This project's goal is to screen scrape and aggregrate data on foreclosed homes in the Burlington and Camden Counties.  Here is a basic list of steps I needed to complete:

1. Open this url based on the county we are grabbing from: http://salesweb.civilview.com/Default.aspx?id=00870 (Burlington County) or http://salesweb.civilview.com/Default.aspx?id=00850 (Camden County)
2. Collect all of the information in a given time frame 
    - between 2 weeks and 3 weeks from the current day
    - disregarding certain cities within each county
3. Click each "details" link and grab that information as well
4. Get additional information from zillow search results for each address
5. Save all of this information in a csv file

Initially I tried to use php curl and ajax to accomplish this task. However, I had 1 major limitiation.  I could not access the details page because it is protected by an event_validation key in aspx.  My solution was found in phantom.js and casper.js which can mimic a browser and navigate as necessary.
