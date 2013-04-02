var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var monthnames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function $(query) {
    return document.querySelectorAll(query)[0];
}

function init() {
    updateDateAndTime();
    setupOriginalNewTabLinkAndDoubleClick();
}

function updateDateAndTime() {
    var now, hours, minutes, seconds, time, dayName, day, month, year, date;

    now = new Date();
    hours = now.getHours();
    minutes = now.getMinutes();
    seconds = now.getSeconds();

    if (hours >= 12) hours -= 12;
    if (hours === 0) hours = 12;
    if (minutes <= 9) minutes = '0' + minutes;
    if (seconds <= 9) seconds = '0' + seconds;
    time = hours + ':' + minutes + ':' + seconds;

    dayName = weekdays[now.getDay()];
    day = now.getDate();
    month = monthnames[now.getMonth()];
    year = now.getFullYear();
    date = dayName + ', ' + month + ' ' + day + ', ' + year;

    $('.time').innerHTML = time;
    $('.date').innerHTML = date;

    setTimeout(function(){
        updateDateAndTime();
    }, 1000);
}

function setupOriginalNewTabLinkAndDoubleClick() {
    var $originalTabLink = $('.original-new-tab');

    function openOriginalNewTab() {
        chrome.tabs.update({
            url:'chrome-internal://newtab/'
        });
    }

    $originalTabLink.innerHTML = '&#9658;';

    $originalTabLink.addEventListener('click', function(){
        openOriginalNewTab();
        return false;
    });

    document.addEventListener('dblclick', function(){
        openOriginalNewTab();
    });
}

init();