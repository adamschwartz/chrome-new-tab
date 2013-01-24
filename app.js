var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var monthnames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function init() {
    updateDateAndTime();
    setupOriginalNewTabLink();
}

function updateDateAndTime() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    if (hours >= 12) hours -= 12;
    if (hours === 0) hours = 12;
    if (minutes <= 9) minutes = '0' + minutes;
    if (seconds <= 9) seconds = '0' + seconds;
    var time = hours + ':' + minutes + ':' + seconds;

    var day_name = weekdays[now.getDay()];
    var day = now.getDate();
    var month = monthnames[now.getMonth()];
    var year = now.getFullYear();
    var date = day_name + ', ' + month + ' ' + day + ', ' + year;

    $('.time').html(time);
    $('.date').html(date);

    setTimeout(function(){
        updateDateAndTime();
    }, 1000);
}

function setupOriginalNewTabLink() {
    $('.original-new-tab').click(function(){
        chrome.tabs.update({
            url:'chrome-internal://newtab/'
        });
        return false;
    });
}

init();