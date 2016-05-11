
var casper = require('casper').create();
var fs = require('fs');
//Burlington County: id=00870
//Camden County: id=00850
var url = "http://salesweb.civilview.com/Default.aspx?id=00870";

function getSearchAddress(fullAddress){
	a = fullAddress.split(" ");
	
	//console.log(a);
	var zip = a.pop(),
		state = a.pop(),
		city = a.pop();

	if(city == "TWP" || city == "TWP."){
		city = a.pop();
	}

	var full_city = city;

	if(full_city == "WINSLOW"){
		full_city = "";
	}

	//console.log(a);
	var address = a[0] + "+" + a[1] + "+" + a[2];
	var onward = true;
	for(var i=3; i<a.length; i++){
		if(onward){
			if(a[i] != city && a[i] != undefined && a[i].search("/K/") < 0 && a[i] != "MAILING" && a[i] != "WITH"){
				switch(a[i]){
					case "MT.":
						full_city = "MOUNT+" + city;
						onward = false;
						break;
						
					case "MAPLE":
						full_city = "MAPLE+" + city;
						onward = false;
						break;
						
					case "BROWNS":
						full_city = "BROWNS+" + city;
						onward = false;
						break;
						
					case "TOWNSHIP":
						full_city = "TOWNSHIP+OF+FLORENCE+" + city;
						onward = false;
						break;
					
					default:
						address = address + "+" + a[i];
						break;
				}
			}
			else if(a[i] == city || a[i].search("/K/") >= 0 || a[i] == "MAILING" || a[i] == "WITH"){
				break;
			}
		}
	}
	var citystatezip = full_city + " " + state + " " + zip;
	return [address,citystatezip];
}

casper.userAgent('Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)');

casper.start(url, function(){
	console.log("opened the site");

});

casper.then(function(){
	var links = this.evaluate(function(){
		var a = document.querySelectorAll("tr.alt, tr.row");
		var links = [];
		for(i=0; i < a.length; i++){
			var el = a[i];
			var url = el.querySelector("a").href;

			var date = el.querySelectorAll("td")[2].textContent,
				plaintiff = el.querySelectorAll("td")[3].textContent,
				defendent = el.querySelectorAll("td")[4].textContent,
				address = el.querySelectorAll("td")[5].textContent;

			var dateTime = new Date(date).getTime();
			var now = new Date().getTime();
			var oneWeek = 6*24*60*60*1000;
			var earliest = new Date(now+(2*oneWeek)).getTime();
			var latest = new Date(now+(3*oneWeek)).getTime();
			//console.log("today: " + now + ", compare:" + date + ", later: " + later);
			if(earliest <= dateTime && dateTime <= latest){
				console.log("earlier: " + new Date(earliest) + ", compare:" + new Date(date) + ", later: " + new Date(latest));
				if(/Bass River|Beverly|Browns Mills|Burlington city|Chesterfield|Delanco|Edgewater|Fieldsboro|Mansfield|Hanover|Pemberton|Riverside|Springfield|Washington|Willingboro|Woodland|Wrightstown|Atco|Blackwood|Camden|Clementon|Erial|Lindenwold|Magnolia|Ephraim|Pennsauken|Pine Hill|Woodlynne/i.test(address)){
				}
				else {
					links.push(url + "^" + date + "^" + plaintiff + "^" + defendent + "^" + address);
				}
			}
		}
		return links;
	});

	casper.eachThen(links,function(link){
		var listing = link.data.split("^");

		var href = listing[0],
			date = listing[1],
			plaintiff = listing[2],
			defendent = listing[3],
			address = listing[4];

		var search = getSearchAddress(address);
		var zillowapi = "http://www.zillow.com/webservice/GetDeepSearchResults.htm?zws-id=X1-ZWz1du18on3evf_6v82r&address="+encodeURIComponent(search[0])+"&citystatezip="+encodeURIComponent(search[1]);

		//console.log(listing);
		//console.log("-----------\n" + url + '\n' + date + '\n' + plaintiff + '\n' + defendent + '\n' + address);

		this.thenOpen(zillowapi);
		this.then(function(){
			var zillowValue = this.evaluate(function(){
				var amount = 0;
				var sqfoot = 0;
				if(document.querySelector("amount")){
					amount =  Math.round(parseInt(document.querySelector("amount").textContent)/1000);
				}
				if(document.querySelector("finishedSqFt")){
					sqfoot = document.querySelector("finishedSqFt").textContent;
				}

				return [amount,sqfoot];
			});
			this.thenOpen(url);
			this.thenClick('a[href="'+href+'"]', function(){
				console.log("-----------");
			});
			this.then(function(){
				console.log(zillowValue);
				
				var caseNumber = this.fetchText("#grdSalesData > tbody > tr:nth-child(2) > td:nth-child(2)");
				var judgement = Math.round(Number(this.fetchText("#grdSalesData > tbody > tr:nth-child(7) > td:nth-child(2)").replace(/[^0-9\.]+/g,""))/1000);
				var attorney = this.fetchText("#grdSalesData > tbody > tr:nth-child(8) > td:nth-child(2)");

				console.log(date + '\n' + address + '\n' + judgement);
				var stream = fs.open('sheriffsales.csv','aw');
				stream.writeLine(caseNumber + "^" + date + "^" + plaintiff + "^" + defendent + "^" + address + "^" + attorney + "^" + judgement + "^" + zillowValue[0] + "^" + zillowValue[1]);
				stream.close();

				//this.exit();
			});
		});
		

	});

	casper.then(function(){
		console.log("complete");
	});
});

casper.run(function(){
	this.exit();
});