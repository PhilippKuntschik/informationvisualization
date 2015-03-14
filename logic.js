/**
 * Created by kuntscphili1 on 14.03.2015.
 */

var URLBLANK = "https://api.stackexchange.com/2.2/";
var USER = URLBLANK + "users";
var USER_TOP100 = USER + "?pagesize=100&order=desc&sort=reputation&site=stackoverflow&filter=!LnNkvq0X7-kuAbMwJEZJkY";
var USER_TOPTAP_PRE = USER + "/";
var USER_TOPTAG_SUF = "/tags?pagesize=1&order=desc&sort=popular&site=stackoverflow&filter=!9f2SLi*Gz";
var TAG = URLBLANK + "tags";
var TAG_TOP100 = TAG + "?pagesize=100&order=desc&sort=popular&site=stackoverflow&filter=!9f2SLi*Gz";

var tagsLoaded = false;
var usersLoaded = false;

var dataLoadedComplete = function () {
    return (tagsLoaded && usersLoaded)
};

function initData() {
    $.ajax(TAG_TOP100).done(function (data) {
        tagsLoaded = true;
        initDia();
    });
    $.ajax(USER_TOP100).done(function (data) {
        $.each(data.items, function (index) {
            updateUserWithTags($(data.items).get(index));
        });
        usersLoaded = true;
        initDia();
    });
}

function updateUserWithTags(userObject) {
    $.ajax(USER_TOPTAP_PRE + userObject.user_id + USER_TOPTAG_SUF).done(function (data) {
        userObject.tag = data.items;
    });
}

function initDia() {
    if (!dataLoadedComplete())
        return;

}