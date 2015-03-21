/**
 * Created by kuntscphili1 on 14.03.2015.
 */

var URLBLANK = "https://api.stackexchange.com/2.2/";
var USER = URLBLANK + "users";
var USER_TOP100 = USER + "?pagesize=10&order=desc&sort=reputation&site=stackoverflow&filter=!LnNkvq0X7-kuAbMwJEZJkY";
//var USER_TOP100 = "./data/users.json";
var USER_TOPTAG_PRE = USER + "/";
var USER_TOPTAG_SUF = "/tags?pagesize=1&order=desc&sort=popular&site=stackoverflow&filter=!9f2SLi*Gz";
var TAG = URLBLANK + "tags";
var TAG_TOP100 = TAG + "?pagesize=10&order=desc&sort=popular&site=stackoverflow&filter=!9f2SLi*Gz";
//var TAG_TOP100 = "./data/tags.json";

var tagsLoaded = false;
var usersLoaded = false;

var users;
var tags;

var dataLoadedComplete = function () {
    return (tagsLoaded && usersLoaded)
};

function initData() {
    $.ajax(TAG_TOP100).done(function (data) {
        tags = data.items;
        tagsLoaded = true;
        initDia();
    });
    $.ajax(USER_TOP100).done(function (data) {
        users = data.items;
        updateUserWithTags();
    });
}

var i = 999;
function updateUserWithTags() {
    $users = $(users);

    if (i < $users.size()) {
        var user = $users.get(i);
        i++;
        console.log("helloworld");
        $.ajax(USER_TOPTAG_PRE + user.user_id + USER_TOPTAG_SUF).done(function (data) {
            user.tags = data.items;
            var timeout = 1000;
            if(data.backoff != undefined)
            timeout = timeout * data.backoff;
            setTimeout(updateUserWithTags, timeout);
        });
    }
    else {
        //used to save to local file storage
        //saveAs(new Blob([JSON.stringify(users)], {type: "text/plain;charset=utf-8"}), "users.json");
        usersLoaded = true;
        initDia();
    }
}

function initDia() {
    if (!dataLoadedComplete())
        return;
    var x = d3.scale.linear().domain([0, d3.max(data, function(d){return d.count})])

    d3.select("#d3Dia").data(tags).enter().append("div").
        .style("background-color", "black");
}