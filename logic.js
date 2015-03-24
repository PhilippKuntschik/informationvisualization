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
var chartWidth, chartHeight, upperspace;
var users, tags;
var links = new Array();

//
var userCircleRadius = 15;
var barZooming = 0.8;


function initData() {

    chartWidth = $(document).width() - 50;
    chartHeight = $(document).height() - 50;
    upperspace = chartHeight * .2;

    $.ajax(TAG_TOP100).done(function (data) {
        tags = data.items;
        updateTagsWithStartPosition();
    });
    $.ajax(USER_TOP100).done(function (data) {
        users = data; // use "data" if you load from json, and "data.items" if you load from url!
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
            user.preludePositionX = ((chartWidth - userCircleRadius * 2) * Math.random()) + userCircleRadius;
            user.preludePositionY = ((chartHeight - userCircleRadius * 2) * Math.random()) + userCircleRadius;

            var timeout = 1000;
            if (data.backoff != undefined)
                timeout = timeout * data.backoff;
            setTimeout(updateUserWithTags, timeout);
        });
    }
    else {
        //used to save to local file storage
        //saveAs(new Blob([JSON.stringify(users)], {type: "text/plain;charset=utf-8"}), "users.json");

        //if loading from jsonFile, we need to add the prelude values here:
        $(users).each(function () {
            $(this).get(0).preludePositionX = ((chartWidth - userCircleRadius * 4) * Math.random()) + userCircleRadius * 2;
            $(this).get(0).preludePositionY = ((chartHeight - userCircleRadius * 4) * Math.random()) + userCircleRadius * 2;
        });


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

    $(tags).each(function(tagIndex, tag){
        $(users).each(function(userIndex, user){
            if(tag.name === user.tags[0].name){
                var link = new Object();
                link.source = tagIndex;
                link.target = userIndex;
                links.push(link)
            }
        })
    });

    var chart = d3.select(".chart")
        .attr("height", chartHeight)
        .attr("width", chartWidth);

    next();
}

var systemstatus = 0;

function next() {
    console.log("systemstatus " + systemstatus);
    switch (systemstatus++) {
        case 0:
            tagPrelude();
            break;
        case 1:
            tagInterlude();
            break;
        case 2:
            userPrelude();
            break;
        case 3:
            userInterlude();
            break;
        default:
            break;
    }
}

var drag = d3.behavior.drag()
    .origin(function (d) {
        return d;
    })
    .on("dragstart", dragstarted)
    .on("drag", dragmove);

function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
}

function dragmove(d) {
    d3.select(this).attr("transform", function (d) {
        d.preludePositionX = d3.event.sourceEvent.clientX;
        d.preludePositionY = d3.event.sourceEvent.clientY;
        return "translate(" + [Math.round(d.preludePositionX), Math.round(d.preludePositionY)] + ")";
    });
}

function tagPrelude() {
    //TODO: tooltip
    //TODO: color

    function startPos(isWidth, endPos) {
        if (isWidth)
            return chartWidth / 2 + (((chartWidth / 2) - endPos) * .1);
        else
            return chartHeight / 2 + (((chartHeight / 2) - endPos) * .1);
    }

    var tag = d3.select(".chart")
        .append("g").attr("class", "tag-container")
        .selectAll("g.tag")
        .data(tags)
        .enter().append("g")
        .attr("class", "tag");

    tag.append("title")
        .text(function (d) {
            return d.name + " : " + d.count;
        });

    var path = tag.append("path").attr("d", function (d) {
        var startposX = Math.round(startPos(true, d.preludePositionX));
        var startposY = Math.round(startPos(false, d.preludePositionY));
        var endposX = Math.round(d.preludePositionX);
        var endposY = Math.round(d.preludePositionY);
        var controlX = endposX;
        var controlY = endposY - 50;
        return "M" + startposX + "," + startposY + " C" + startposX + "," + startposY + " " + controlX + "," + controlY + " " + endposX + "," + endposY;
    });

    var circle = tag.append("circle")
        .style("fill", "steelblue")
        .call(drag)
        .attr("opacity", "0.0")
        .attr("r", userCircleRadius * 3 + "px")
        .attr("transform", function (d) {
            return "translate(" + [Math.round(startPos(true, d.preludePositionX)), Math.round(startPos(false, d.preludePositionY))] + ")";
        });

    circle.transition()
        .duration(1000)
        .delay(function (d, i) {

            return i * 10;
        })
        .attr("opacity", "1")
        .attr("r", userCircleRadius + "px")
        .attrTween("transform", function (d, i) {
            var path = d3.select(this.parentNode).select("path").node();
            return function (t) {
                var p = path.getPointAtLength(path.getTotalLength() * t);
                return "translate(" + [p.x, p.y] + ")";
            };
        })
}


function tagInterlude() {
    //TODO: width
    //TODO: scala

    var circleFall = 1000;
    var barRise = 1000;
    var barShift = 1000;

    var barWidth = (chartWidth / tags.length) - 1;

    var tag = d3.select(".chart")
        .select("g.tag-container")
        .selectAll("g.tag");

    var path = tag.select("path")
        .attr("d", function (d) {
            var startposX = Math.round(d.preludePositionX);
            var startposY = Math.round(d.preludePositionY);
            var endposX = startposX;
            var endposY = startposY + chartHeight;
            return "M" + startposX + "," + startposY + " L" + endposX + "," + endposY;
        });

    var circle = tag.select("circle");

    circle.transition()
        .duration(circleFall)
        .delay(function (d, i) {
            return i * 5;
        })
        .attrTween("transform", function (d, i) {
            var path = d3.select(this.parentNode).select("path").node();
            return function (t) {
                var p = path.getPointAtLength(path.getTotalLength() * t);
                return "translate(" + [p.x, p.y] + ")";
            };
        })
        .remove();

    var y = d3.scale
        .linear()
        .domain([0, d3.max(tags, function (d) {
            return d.count;
        })])
        .range([(chartHeight), upperspace]);

    var sortPosition = d3.scale.ordinal()
        .rangeRoundBands([0, chartWidth], .1, 1)
        .domain(tags.sort(function (a, b) {
            return b.preludePositionX - a.preludePositionX;
        })
            .map(function (d) {
                return d.name;
            }));

    tag.sort(function (a, b) {
        return sortPosition(a.name) - sortPosition(b.name);
    });

    var bar = tag.append("rect")
        .attr("x", function (d) {
            return sortPosition(d.name);
        })
        .attr("width", barWidth)
        .attr("y", chartHeight)
        .attr("height", 0);

    bar.transition()
        .duration(barRise)
        .delay(circleFall)
        .attr("y", function (d) {
            return y(d.count);
        })
        .attr("height", function (d) {
            return chartHeight - y(d.count);
        });

    var sortCount = d3.scale.ordinal()
        .rangeRoundBands([0, chartWidth], .1, 1)
        .domain(tags.sort(function (a, b) {
            return b.count - a.count;
        })
            .map(function (d) {
                return d.name;
            }));

    tag.sort(function (a, b) {
        return sortCount(a.name) - sortPosition(b.name);
    });

    bar.transition()
        .delay(circleFall + barRise)
        .attr("x", function (d) {
            return sortCount(d.name);
        });
}

function userPrelude() {
    //TODO: addImage
    //TODO: barchart unclickable
    //TODO: circle fly-in

    var chart = d3.select(".chart");

    var fadeOutX = (chartWidth * (1 - barZooming)) / 2;
    var fadeOutY = (chartHeight * (1 - barZooming));

    var userContainer = chart
        .append("g").attr("class", "user-container");

    var user = userContainer
        .selectAll("g.user")
        .data(users)
        .enter().append("g")
        .attr("class", "user");

    user.append("title")
        .text(function (d) {
            return d.display_name;
        });

    var circle = user.append("circle")
        .style("fill", "red")
        .attr("opacity", "0.0")
        .attr("r", userCircleRadius * 4 + "px")
        .call(drag)
        .attr("transform", function (d) {
            return "translate(" + [Math.round(d.preludePositionX), Math.round(d.preludePositionY)] + ")";
        });

    var tagContainer = chart.select("g.tag-container")
        .transition()
        .duration(1500)
        .attr("opacity", 0.5)
        .attr("transform", "translate(" + [fadeOutX, fadeOutY] + ")scale(" + [barZooming, barZooming] + ")");

    circle.transition()
        .duration(1500)
        .attr("opacity", 1)
        .attr("r", userCircleRadius * 2 + "px");
}

function userInterlude() {
    var chart = d3.select(".chart");

    var tagContainer = chart.select("g.tag-container")
        .transition()
        .duration(1500)
        .attr("opacity", 1)
        .attr("transform", "translate(" + [0, 0] + ")scale(" + [1, 1] + ")");

    var userContainer = chart.select("g.user-container");

    var circle = userContainer.selectAll("g.user").select("circle").transition()
        .duration(1500)
        .attr("opacity", 1)
        .attr("r", userCircleRadius + "px");
}