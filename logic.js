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

var first = true;


function initData(){
    $.ajax(TAG_TOP100);
    $.ajax(USER_TOP100).done(function( data ) {
        $.each(data.items, function (index){
            if(first){
            updateUserWithTags($(data.items).get(index));
                first = false;
            }
        });
    });
}

function updateUserWithTags(userObject){
    $.ajax(USER_TOPTAP_PRE + userObject.user_id + USER_TOPTAG_SUF).done(function (data){});
}
