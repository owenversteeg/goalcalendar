/*jshint globalstrict: true*/

/*jshint eqeqeq:true, bitwise:true, strict:false, undef:true, unused:true, curly:true, browser:true */

var currentlySelectedDate = new Date(); //Always equal to [currently selected month] [day of pageload] [currently selected year] [time of pageload]
//example: if page was loaded on Mar 15, 2013 at 11:57:55, and you navigated to June 2015, currentlySelectedDate would be Jun 15 2015 11:57:55
var areYearsShowing = false; //whether or not the years calendar ('yearendar') is showing
var dfb = 0; //how many days from the beginning of the calendar does the month start (e.g. Aug 2013 starts 4 days from the start of the calendar - on a Thurs)
var highlighted = -1; //Which cell ID is highlighted as the current date. Only applicable, of course, when on the current month. Antiquated
var oldHighlighted = -1; //When the "highlighted" date was last changed, whatever its' prior value was | Antiquated
var isHighlighted = true; //Whether or not something on the current page is highlighted. | Antiquated
var go; //Tells yearOnClick whether or not it's OK to do its' thing. Antiquated and should be removed.
var years = {i:0}; //An old and messy object that keeps track of the what date the yearendar starts.

function changeYear(n) {
	//Change the year - p=previous year, n=next
	if (n === 'n') {
		refreshYears(parseInt(($('#ytext')[0].innerText).substring(0,4),10)+100);
	}
	if (n === 'p') {
		refreshYears(parseInt(($('#ytext')[0].innerText).substring(0,4),10)-100);
	}
}
	
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

$(document).ready(function() {
	//Only do this stuff when the document's ready...
	
	Mousetrap.bind('left', function() { if(areYearsShowing) { changeYear('p'); } else { chMon('p'); } });
	
	Mousetrap.bind('right', function() { if(areYearsShowing) { changeYear('n'); } else { chMon('n'); } });
	
	Mousetrap.bind('up up down down left right left right b a enter', function() {
		alert('Konami code!');
	});

	Mousetrap.bind('esc', function() {
		refreshYears(parseInt($('#ytext')[0].innerText.substring(0,4),10));
		showYears(); 
	});

	bindTouchStuff();

	resizeStuff();

	refreshCalendar();
	
	refreshYears(2001);
	
	reloadBubbles();
});

function reloadBubbles() {
	//remove all dots on the page
	var x = 1;
	$.each($('.dots'), function() { 
		this.innerHTML = ""; 
		this.id = 'dots'+x;
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
				$('#dots'+(x+dfb))[0].innerHTML += '<a href="#detailsModal" data-toggle="modal" onclick="$(&#39;#detailsModalLabel&#39;)[0].innerText = &#39;'+dated+' - '+datas[i].name+'&#39;; $(&#39;#detailsModalBody&#39;)[0].innerText = &#39;'+datas[i][dated]+'&#39;"><li class="'+datas[i].color+'"></li></a> ';
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
		if (areYearsShowing) {
			if (ev.direction === "right") {
				changeYear('p');
			}
			if (ev.direction === "left") {
				changeYear('n');
			}
		}
		else {
			if (ev.direction === "right") {
				chMon('p');
			}
			if (ev.direction === "left") {
				chMon('n');
			}
		}
	};
	hammer = new Hammer(document.getElementById("all"));

	hammer.ontransformstart = function(ev) { 
		refreshYears(parseInt($('#ytext')[0].innerText.substring(0,4),10));
		showYears();
	};
}

function daysInMonth(month,year) {
	return new Date(year, month, 0).getDate();
}

function refreshCalendar() {
	setTimeout(removeHighlight,10);
}

function removeHighlight() {
	$('#day'+highlighted).removeClass('today');
	setTimeout(continueRefreshingStuff,10);
}

function continueRefreshingStuff() {
	$('#day'+highlighted).removeClass('today');

	$('#daysmonth').addClass('zoom');
	
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
	
	setTimeout(unZoom, 200);
	
	reloadBubbles();
}

function unZoom() {
	if (!isHighlighted) $('#day'+oldHighlighted).removeClass('today');
	$("#daysmonth").removeClass("zoom");
}

function showYears() {
	$('#calendar')[0].style.display = "none";
	$('#yearendar')[0].style.display = "block";
	areYearsShowing = true;
}

var yearOnClick = function () { 
	if (go===true) { 
		areYearsShowing = false;
		currentlySelectedDate.setYear(parseInt(this.innerText,10)); 
		refreshCalendar(); 
		$('#yearendar')[0].style.display = "none"; 
		$('#calendar')[0].style.display = "block"; 
	} 
};

function refreshYears_inner() {
	if (years.currentYearBlock.innerText !== undefined) {
		years.currentYearBlock.innerText = years.start+years.i;
		years.currentYearBlock.onclick=yearOnClick;
		years.i++;
	}
}

function refreshYears(start) {
	go = false;

	years.i = 0;
	
	for (var z=1; z<11; z++) {
		years.start = start;
		years.currentYearBlock = this;
		$.each($('#tr'+z)[0].childNodes, refreshYears_inner);
	}
	
	$('#ytext')[0].innerText = start + '-' + (start+99);
	
	go=true;
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
	$.post( "http://goalcalendar.aws.af.cm/login", { username: username.value, password: password.value }, function( data ) {
		alert(data);
	});
}

function register() {
	$.post( "http://goalcalendar.aws.af.cm/register", { username: username.value, password: password.value, email: email.value }, function( data ) {
		alert(data)
	});
}
