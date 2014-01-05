/*jshint globalstrict: true*/

/*jshint eqeqeq:true, bitwise:true, strict:false, undef:true, unused:true, curly:true, browser:true */

function blankEvents() {
	datas = [];
	goal1 = {'name': 'Goal 1','color': 'blue'};
	goal2 = {'name': 'Goal 2','color': 'yellow'};
	goal3 = {'name': 'Goal 3','color': 'green'};
	goal4 = {'name': 'Goal 4','color': 'red'};
	datas.push(goal1, goal2, goal3, goal4);

	reloadBubbles();
	updateGoalText();
}

function validateEmail(email) {
	//http://stackoverflow.com/a/46181/1608264
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

function validatePassword(password) {
	//at least one number, one lowercase and one uppercase letter
	//at least six characters
	var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
	return re.test(password);
}

function validateUsername(username) {
	//characters such as 0-9, A-Z, a-z, _, ., @, 3-100 characters long
	var re = /^[\w\.@]{3,100}$/;
	return re.test(username);
}

var currentlySelectedDate = new Date(); //Always equal to [currently selected month] [day of pageload] [currently selected year] [time of pageload]
//example: if page was loaded on Mar 15, 2013 at 11:57:55, and you navigated to June 2015, currentlySelectedDate would be Jun 15 2015 11:57:55
var dfb = 0; //how many days from the beginning of the calendar does the month start (e.g. Aug 2013 starts 4 days from the start of the calendar - on a Thurs)
var highlighted = -1; //Which cell ID is highlighted as the current date. Only applicable, of course, when on the current month. Antiquated
var oldHighlighted = -1; //When the "highlighted" date was last changed, whatever its' prior value was | Antiquated
var isHighlighted = true; //Whether or not something on the current page is highlighted. | Antiquated

var serverURL = "http://goalcalendar.aws.af.cm";

function chMon(p) {
	//Change the month - p=previous month, n=next
	if (p === 'p') { 
		currentlySelectedDate.setMonth(currentlySelectedDate.getMonth()-1);
	}
	else if (p === 'n') {
		currentlySelectedDate.setMonth(currentlySelectedDate.getMonth()+1);
	}
	refreshCalendar();
}

function logout() {
	localStorage.removeItem('username');
	localStorage.removeItem('key');
	location.reload();
}

$(document).ready(function() {
	//Only do this stuff when the document's ready...
	
	Mousetrap.bind('left', function() { chMon('p'); });
	
	Mousetrap.bind('right', function() { chMon('n'); });
	
	Mousetrap.bind('enter', function() { 
		if (email && email.style.opacity === "1") signup.onclick();
	});
	
	Mousetrap.bind('up up down down left right left right b a enter', function() {
		alert('Konami code!');
	});

	bindTouchStuff();

	resizeStuff();

	refreshCalendar(true);
	
	reloadBubbles(true);
	
	//If the user is logged in, add the login text to the hero unit and re-show it 
	if (localStorage.getItem('username') && localStorage.getItem('key')) {
		document.head.innerHTML += "<style type='text/css'>.hero { display: block; }</style>"
		makeLoggedInStyle(localStorage.getItem('username'));
		getNewDataFile();
	}
	
	updateGoalText();
	
	if (typeof username !== "undefined") {
		username.onkeyup = password.onkeyup = email.onkeyup = function() {
			//autovalidation
			colors = ["black", "black", "black"];
	
			if (!validateUsername(username.value)) colors[0] = "red";
			if (!validatePassword(password.value)) colors[1] = "red";
			if (!validateEmail(email.value)) colors[2] = "red";

			username.style.color = colors[0];
			password.style.color = colors[1]
			email.style.color = colors[2]
		
			if (colors[0] === "red") warningp.innerText = "Your password must be at least six characters and include one number, one lowercase letter, and one uppercase leter.";
			if (colors[1] === "red") warningp2.innerText = "Your username must be at least three characters and can include letters, numbers, and the following symbols: @ . _";
		};
	}
});

function updateGoalText() {
	for (var i=0; i<4; i++) {
		whichgoal.children[i].innerText = datas[i].name;
		window["dot"+(i+1)].innerText = datas[i].name;
		window["goal"+(i+1)].value = datas[i].name;
	}
}

function reloadBubbles(isFirstRun) {
	//remove all dots on the page
	var x = 1;
	$.each($('.dots'), function() { 
		this.innerHTML = "";
		this.id = 'dots'+x;
		//bacon-wrapped dot divs (or rather, a-wrapped dot divs)
		if (isFirstRun) {
			this.parentElement.children[0].outerHTML = '<a href="#newDailyGoalCompletedModal" rel="modal:open" style="display: block;" onclick="dailygoaldate.value=\''+(currentlySelectedDate.getMonth()+1)+'/'+window["dots"+x].parentElement.children[0].children[0].innerText+'/'+currentlySelectedDate.getUTCFullYear()+'\';">'+this.parentElement.children[0].outerHTML+'</a>';
			this.parentElement.children[0].onclick = function() { 
				dailygoaldate.value=(currentlySelectedDate.getMonth()+1)+'/'+this.children[0].innerText+'/'+currentlySelectedDate.getUTCFullYear();
			}
		} else {
			this.parentElement.children[0].onclick = function() { 
				dailygoaldate.value=(currentlySelectedDate.getMonth()+1)+'/'+this.children[0].innerText+'/'+currentlySelectedDate.getUTCFullYear();
			}
		}
		x++;
	});
	x=1;
	
	//create new dots
	for (var i=0; i<datas.length; i++) { 
		//runs once for every type of event. example: if there are two (e.g. "violin" and "homework") it would run twice
		for (x=1; x<daysInMonth(currentlySelectedDate.getMonth()+1,currentlySelectedDate.getUTCFullYear())+1; x++) {
			//runs once for each day in that month
			var dated = (currentlySelectedDate.getMonth()+1).toString()+'/'+x.toString()+'/'+currentlySelectedDate.getUTCFullYear().toString();
			//gets that day of the month; format mm/dd/yyyy (but if month or day is single char it does _not_ prefix a 0)

			if (typeof datas[i][dated] !== 'undefined') {
				//only runs if that day of the month has any of the current type of event
				$('#dots'+(x+dfb))[0].innerHTML += '<a href="#detailsModal" rel="modal:open" onclick="$(&#39;#detailsModalLabel&#39;)[0].innerText = &#39;'+dated+' - '+datas[i].name+'&#39;; $(&#39;#detailsModalBody&#39;)[0].innerText = &#39;'+datas[i][dated]+'&#39;"><li class="'+datas[i].color+'"></li></a> ';
				//adds a dot to that day. Each dot has a link which modifies, then opens a prefab BS modal containing details of that event
				//TODO: use the HTML5 history API to change the URL and let people link to an event. Make sure to cover a scenario in which that event doesn't exist
			}
		}
	}
	
	//ending
	for (x=1; x<daysInMonth(currentlySelectedDate.getMonth()+1,currentlySelectedDate.getUTCFullYear())+1; x++) {
		//for each day in month
		$('#dots'+(x+dfb))[0].innerHTML = '<ul>' + $('#dots'+(x+dfb))[0].innerHTML + '</ul>';
	}
}

function bindTouchStuff() {
	var hammer = new Hammer(document.getElementById("all"));

	hammer.ondragstart = function(ev) { 
		if (ev.direction === "right") {
			chMon('p');
		}
		if (ev.direction === "left") {
			chMon('n');
		}
	};
	hammer = new Hammer(document.getElementById("all"));
}

function daysInMonth(month,year) {
	return new Date(year, month, 0).getDate();
}

function refreshCalendar(isFirstLoad) {
	setTimeout(function () { removeHighlight(isFirstLoad) },10);
}

function removeHighlight(isFirstLoad) {
	$('#day'+highlighted).removeClass('today');
	setTimeout(function () { continueRefreshingStuff(isFirstLoad) },10);
}

function continueRefreshingStuff(isFirstLoad) {
	$('#day'+highlighted).removeClass('today');

	if (!isFirstLoad) $('#daysmonth').addClass('zoom');

	var fdom = new Date(currentlySelectedDate.getFullYear(), currentlySelectedDate.getMonth(), 1).getDay()+1; //finds first day of month
	
	dfb = 0; //days from beginning that month starts
	
	var mcurrentlySelectedDate = moment(currentlySelectedDate);
	$('#mtext')[0].innerText = moment.months[mcurrentlySelectedDate.month()]+' '+mcurrentlySelectedDate.year();
	
	for (var i=1; i<43; i++) { //43 not 42 and 1 not 0 because dates are not arrayish
		//for each of the 42 day cells
		
		document.getElementById('day'+i).childNodes[1].childNodes[0].innerText = ((i-fdom)+1); //labels days (with neg. #s, unfortunately)
		if ((i-fdom)+1<1) {
			dfb++;
			//if there are days numbered 0 or less
			var x = daysInMonth(currentlySelectedDate.getMonth(),currentlySelectedDate.getUTCFullYear()); //days in previous month
			document.getElementById('day'+i).childNodes[1].childNodes[0].innerText = (x+((i-fdom)+1)); //renumber dates before start of month correctly
		}
		else if ((i-fdom)+1>daysInMonth(currentlySelectedDate.getMonth()+1,currentlySelectedDate.getUTCFullYear())) {
			//if there are days numbered over the max. # of days in this month
			document.getElementById('day'+i).childNodes[1].childNodes[0].innerText = (((i-fdom)+1)-daysInMonth(currentlySelectedDate.getMonth()+1,currentlySelectedDate.getUTCFullYear())); //renumber dates after end of month correctly
		}
	}
	isHighlighted=false;
	if (mcurrentlySelectedDate.month() === new Date().getMonth()) {
		$('#day'+(new Date().getDate()+dfb)).addClass('today');
		oldHighlighted = highlighted;
		highlighted = (new Date().getDate()+dfb);
		isHighlighted = true;
	}
	
	if (!isFirstLoad) setTimeout(unZoom, 200);
	
	reloadBubbles();
}

function unZoom() {
	if (!isHighlighted) $('#day'+oldHighlighted).removeClass('today');
	$("#daysmonth").removeClass("zoom");
}


$(window).resize(function() {
	resizeStuff();
});

function resizeStuff() {
        var eye = 0, styleToSet = 'width:'+($('#calheader')[0].clientWidth-7)/7+'px !important';
        $.each($('.day'), function() {
                eye++;
                this.setAttribute('style', styleToSet);
        });
        
        $.each($('.dayweek'), function() {
                this.setAttribute('style', styleToSet);
        });
}

window.onload=resizeStuff;

function login() {
	//blue
	$('#signin').addClass('nohover');
	signin.innerHTML = "<img src='http://i.imgur.com/qdIdw47.gif' alt='loading icon' style='height: 24px;'></img>";
	signin.onclick = console.log;
	$.post( serverURL + "/login", { username: username.value, password: password.value }, function(data) {
		if (data.indexOf('You have been logged in!') !== -1) {
			alert(data.substr(0,data.indexOf('|')-1));
			var key = data.substr(data.indexOf('|')+2);
			localStorage.setItem('username', username.value);
			localStorage.setItem('key', key);
			makeLoggedInStyle(username.value);

			getNewDataFile();
		} else {
			alert(data);
			$('#signin').removeClass('nohover');
			signin.innerHTML = "Sign in";
			signin.onclick = login;
		}
	});
}

function makeLoggedInStyle(usernameToUse) {
	all.style.height = "500px";
	document.getElementsByClassName('signuporin')[0].innerHTML = "Signed in as " + usernameToUse + " &middot; <a class='link' onclick='logout()'>Logout</a>"; 
	document.getElementsByClassName('herobody')[0].innerHTML = '<a class="link" onclick="showHelpText();">Help</a>';
	//document.getElementsByClassName('signuporin')[0].innerHTML = '<button class="btn-a btn-small" style="margin: 0;">Add Event</button>;
	document.getElementsByClassName('signuporin')[0].style.cssText += "color: white; text-align: right; width: 400px; margin-top: -1px;";
	document.getElementsByClassName('herobody')[0].style.cssText += "width: 330px;"
}

function showHelpText() {
	document.getElementsByClassName('herobody')[0].innerHTML = "Welcome to GoalCalendar! To get started, rename your goals by clicking on the list of goals in the bottom right corner.<br><br>Next, mark a daily goal as completed by clicking on a day number.";
}

function getUserStarted() {
	blankEvents();
	showHelpText();
	updateGoalText();
	saveNewDailyGoals(true);
}

function register() {
	$('#signup').addClass('nohover');
	//make the spinner - it's green
	signup.innerHTML = "<img src='http://i.imgur.com/U1OZOIn.gif' alt='loading icon' style='height: 24px;'></img>";
	signup.onclick = console.log;
	$.post( serverURL + "/register", { username: username.value, password: password.value, email: email.value }, function( data ) {
		if (data.indexOf('Your account has been made!') !== -1) {
			alert(data.substr(0,data.indexOf('|')-1));
			var key = data.substr(data.indexOf('|')+2);
			localStorage.setItem('username', username.value);
			localStorage.setItem('key', key);
			makeLoggedInStyle(username.value);
			
			getUserStarted();
		} else {
			alert(data);
			$('#signup').removeClass('nohover');
			signup.innerHTML = "Sign up";
			signup.onclick = register;
		}
	});
}

//If the user is logged in, hide the hero unit
if (localStorage.getItem('username') && localStorage.getItem('key')) document.head.innerHTML += "<style type='text/css'>.hero { display: none; }</style>"

function saveNewCompletedDailyGoal() {
	//blue
	$('#savenewcompleteddailygoalbutton').addClass('nohover');
	savenewcompleteddailygoalbutton.innerHTML = "<img src='http://i.imgur.com/qdIdw47.gif' alt='loading icon' style='height: 24px;'></img>";
	$.post( serverURL + "/newCompletedDailyGoal", { username: localStorage.getItem('username'), key: localStorage.getItem('key'), dailygoaldate: dailygoaldate.value, dailygoaltime: dailygoaltime.value, dailygoaldescription: dailygoaldescription.value, whichgoal: whichgoal.value }, function( data ) {
		savenewcompleteddailygoalbutton.innerHTML = "Save";
		$('#savenewcompleteddailygoalbutton').removeClass('nohover');
		alert(data);
		getNewDataFile();
	});
}

function saveNewDailyGoals(saveNewUserData) {
	//blue
	$('#savenewdailygoalsbutton').addClass('nohover');
	savenewdailygoalsbutton.innerHTML = "<img src='http://i.imgur.com/qdIdw47.gif' alt='loading icon' style='height: 24px;'></img>";
	$.post( serverURL + "/nameDailyGoals", { username: localStorage.getItem('username'), key: localStorage.getItem('key'), goal1: goal1.value, goal2: goal2.value, goal3: goal3.value, goal4: goal4.value, saveNewUserData: saveNewUserData }, function( data ) {
		$('#savenewdailygoalsbutton').removeClass('nohover');
		savenewdailygoalsbutton.innerHTML = "Save";
		alert(data);
		getNewDataFile();
	});
}

function getNewDataFile() {
	$.post( serverURL + "/data.js", { username: localStorage.getItem('username'), key: localStorage.getItem('key') }, function( data ) {
		eval(data); //yadda yadda
		reloadBubbles();
		updateGoalText();
	});
}
