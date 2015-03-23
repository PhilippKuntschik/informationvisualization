/**
 * Created by kuntscphili1 on 14.03.2015.
 */

var URLBLANK = "https://api.stackexchange.com/2.2/";
var USER = URLBLANK + "users";
//var USER_TOP100 = USER + "?pagesize=10&order=desc&sort=reputation&site=stackoverflow&filter=!LnNkvq0X7-kuAbMwJEZJkY";
var USER_TOP100 = "./data/users.json";
var USER_TOPTAG_PRE = USER + "/";
var USER_TOPTAG_SUF = "/tags?pagesize=1&order=desc&sort=popular&site=stackoverflow&filter=!9f2SLi*Gz";
var TAG = URLBLANK + "tags";
var TAG_TOP100 = TAG + "?pagesize=100&order=desc&sort=popular&site=stackoverflow&filter=!9f2SLi*Gz";
//var TAG_TOP100 = "./data/tags.json";

var tagsLoaded = false;
var usersLoaded = false;

//will be defined in initData():
var chartWidth, chartHeight;
var users, tags;

//
var userCircleRadius = 15;


function initData() {

    chartWidth = $(document).width() - 50;
    chartHeight = $(document).height() - 50;

    $.ajax(TAG_TOP100).done(function (data) {
        tags = data.items;
        updateTagsWithStartPosition();
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
            if (data.backoff != undefined)
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

function updateTagsWithStartPosition() {
    $(tags).each(function () {
        var $tag = $(this).get(0);
        $tag.preludePositionX = ((chartWidth - userCircleRadius * 2) * Math.random()) + userCircleRadius;
        $tag.preludePositionY = ((chartHeight - userCircleRadius * 2) * Math.random()) + userCircleRadius;
    });
    tagsLoaded = true;
    initDia();
}


function initDia() {
    if (!(tagsLoaded && usersLoaded))
        return;


    var chart = d3.select(".chart")
        .attr("height", chartHeight)
        .attr("width", chartWidth);
    next();
}

var systemstatus = 0;

function next(){
    console.log("systemstatus " + systemstatus);
    switch (systemstatus++) {
        case 0:
            tagPrelude();
            break;
        case 1:
            tagInterlude();
            break;
        default:
    }
}

function tagPrelude() {
    //TODO: tooltip
    //TODO: color
    //TODO: drag&drop

    function startPos(isWidth, endPos) {
        if (isWidth)
            return chartWidth / 2 + (((chartWidth / 2) - endPos) * .1);
        else
            return chartHeight / 2 + (((chartHeight / 2) - endPos) * .1);
    }

    var tag = d3.select(".chart")
        .selectAll("g.tag")
        .data(tags)
        .enter().append("g")
        .attr("class", "tag");

        tag.append("title")
        .text(function(d) {return d.name + " : " + d.count;});

    var path = tag.append("path").attr("d", function(d){
        var startposX = Math.round(startPos(true, d.preludePositionX));
        var startposY = Math.round(startPos(false, d.preludePositionY));
        var endposX = Math.round(d.preludePositionX);
        var endposY = Math.round(d.preludePositionY);
        var controlX = endposX;
        var controlY = endposY - 50;
        return "M" + startposX + "," + startposY + " C" + startposX + "," +startposY + " " + controlX + "," + controlY + " " + endposX + "," + endposY;
    });

    var circle = tag.append("circle")
        .style("fill", "steelblue")
        .attr("opacity", "0.0")
        .attr("r", userCircleRadius*3 + "px")
        .attr("transform", function(d){
            return "translate(" +  [Math.round(startPos(true, d.preludePositionX)) , Math.round(startPos(false, d.preludePositionY))] + ")";
        });

    circle.transition()
        .duration(1000)
        .delay(function(d, i) { return i * 10; })
        .attr("opacity", "1")
        .attr("r", userCircleRadius + "px")
        .attrTween("transform", function (d, i) {
            var path = d3.select(this.parentNode).select("path").node();
            return function (t) {
                var p = path.getPointAtLength(path.getTotalLength()*t);
                return "translate(" + [p.x , p.y] + ")";
            };
        })
}


function tagInterlude() {

    var tag = d3.select(".chart")
        .selectAll("g.tag");

    var path = tag.select("path")
        .attr("d", function(d){
            var startposX = Math.round(d.preludePositionX);
            var startposY = Math.round(d.preludePositionY);
            var endposX = startposX;
            var endposY = startposY + chartHeight;
            return "M" + startposX + "," + startposY + " L" + endposX + "," + endposY;
        });

    var circle = tag.select("circle");


    circle.transition()
       .delay(function(d, i) { return i * 5; })
       .attrTween("transform", function (d,i) {
           var path = d3.select(this.parentNode).select("path").node();
           return function (t) {
               var p = path.getPointAtLength(path.getTotalLength()*t);
               return "translate(" + [p.x , p.y] + ")";
           };
       })
}
