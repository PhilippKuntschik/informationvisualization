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

    $(tags).each(function (tagIndex, tag) {
        $(users).each(function (userIndex, user) {
            if (tag.name === user.tags[0].name) {
                var link = new Object();
                link.source = tag;
                link.target = user;
                links.push(link)
            }
        })
    });

    // $(users).each(function(userIndex1, user1){
    //     $(users).each(function(userIndex2, user2){
    //         if(user1.tags[0].name === user2.tags[0].name){
    //             var link = new Object();
    //             link.source = user1;
    //             link.target = user2;
    //             links.push(link)
    //     }
    //     })
    // });


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
    .on("dragstart", dragstart)
    .on("drag", dragmove);

function dragstart(d) {
    if (typeof force != 'undefined')
        force.alpha(1);
}

function dragmove(d) {
    d.preludePositionX = d3.event.sourceEvent.clientX;
    d.preludePositionY = d3.event.sourceEvent.clientY;

    d3.select(this)
        .attr("cx", function (d) {
            return d.preludePositionX;
        })
        .attr("cy", function (d) {
            return d.preludePositionY;
        });
    d3.select(this.parentNode).select("defs").select("pattern")
        .attr("x", function (d) {
            return d.preludePositionX + d.circleRadius;
        })
        .attr("y", function (d) {
            return d.preludePositionY + d.circleRadius;
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
        .attr("cx", function (d) {
            return startPos(true, d.preludePositionX);
        })
        .attr("cy", function (d) {
            return startPos(false, d.preludePositionY);
        });

    circle.transition()
        .duration(1000)
        .delay(function (d, i) {

            return i * 10;
        })
        .attr("opacity", "1")
        .attr("r", userCircleRadius + "px")
        .attrTween("cx", function (d, i) {
            var path = d3.select(this.parentNode).select("path").node();
            return function (t) {
                var p = path.getPointAtLength(path.getTotalLength() * t);
                return p.x;
            };
        })
        .attrTween("cy", function (d, i) {
            var path = d3.select(this.parentNode).select("path").node();
            return function (t) {
                var p = path.getPointAtLength(path.getTotalLength() * t);
                return p.y;
            };
        });
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
        .attrTween("cy", function (d, i) {
            var path = d3.select(this.parentNode).select("path").node();
            return function (t) {
                var p = path.getPointAtLength(path.getTotalLength() * t);
                return p.y;
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
            return d.y = y(d.count);
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
            d.x = sortCount(d.name) + barWidth / 2;
            return sortCount(d.name);
        });
}

function userPrelude() {
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

    user.append("defs").append("pattern")
        .attr("id", function (d) {
            return d.user_id;
        })
        .attr("width", userCircleRadius * 8)
        .attr("height", userCircleRadius * 8)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("x", function (d) {
            d.circleRadius = userCircleRadius * 4;
            return d.preludePositionX + d.circleRadius;
        })
        .attr("y", function (d) {
            d.circleRadius = userCircleRadius * 4;
            return d.preludePositionY + d.circleRadius;
        })

        .append("image")
        .attr("xlink:href", function (d) {
            return d.profile_image;
        })
        .attr("width", userCircleRadius * 8)
        .attr("height", userCircleRadius * 8)
        .attr("x", 0)
        .attr("y", 0);


    var circle = user.append("circle")
        .attr("opacity", "0.0")
        .style("fill", function (d) {
            return "url(#" + d.user_id + ")";
        })
        .attr("r", userCircleRadius * 4 + "px")
        .call(drag)
        .attr("cx", function (d) {
            return d.preludePositionX;
        })
        .attr("cy", function (d) {
            return d.preludePositionY;
        });

    user.select("defs").select("pattern")
        .transition()
        .duration(1500)
        .attr("width", userCircleRadius * 4)
        .attr("height", userCircleRadius * 4)
        .attr("x", function (d) {
            d.circleRadius = userCircleRadius * 2;
            return d.preludePositionX + d.circleRadius;
        })
        .attr("y", function (d) {
            d.circleRadius = userCircleRadius * 2;
            return d.preludePositionY + d.circleRadius;
        });

    user.select("defs").select("pattern").select("image")
        .transition()
        .duration(1500)
        .attr("width", userCircleRadius * 4)
        .attr("height", userCircleRadius * 4);

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
    //TODO: highlight 3 greatest on hover
    //TODO: force elements to bar
    var chart = d3.select(".chart");

    force = d3.layout.force()
        .gravity(0)
        .charge(-60)
        .size([chartWidth, chartHeight]);

    force
        .links(links)
        .start();

    var tagContainer = chart.select("g.tag-container")
        .transition()
        .duration(1500)
        .attr("opacity", 1)
        .attr("transform", "translate(" + [0, 0] + ")scale(" + [1, 1] + ")");

    var userContainer = chart.select("g.user-container");

    var user = userContainer.selectAll("g.user");
    user.select("defs").select("pattern")
        .transition()
        .duration(1500)
        .attr("width", userCircleRadius * 2)
        .attr("height", userCircleRadius * 2)
        .attr("x", function (d) {
            d.circleRadius = userCircleRadius;
            return d.preludePositionX + userCircleRadius;
        })
        .attr("y", function (d) {
            d.circleRadius = userCircleRadius;
            return d.preludePositionY + userCircleRadius;
        });

    userContainer.selectAll("g.user")
        .select("defs").select("pattern").select("image")
        .transition()
        .duration(1500)
        .attr("width", userCircleRadius * 2)
        .attr("height", userCircleRadius * 2);


    var circle = user.select("circle");

    circle.transition()
        .duration(1500)
        .attr("opacity", 1)
        .attr("r", userCircleRadius + "px");

    var linkContainer = chart
        .insert("g", "g.user-container").attr("class", "link-container");

    var link = linkContainer.selectAll("g.link")
        .data(links)
        .enter().append("g")
        .attr("class", "link");

    link.append("line")
        .attr("opacity", 0);

    link.select("line")
        .transition()
        .delay(1000)
        .attr("opacity", 1);

    force.on("tick", function (e) {
        var kx = .2 * e.alpha, ky = .4 * e.alpha;
        links.forEach(function (d, i) {
            d.target.preludePositionX += (d.source.x - d.target.preludePositionX) * kx;
            d.target.preludePositionY += (d.source.y - 80 - d.target.preludePositionY) * ky;
        });

        link.select("line")
            .attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.preludePositionX;
            })
            .attr("y2", function (d) {
                return d.target.preludePositionY;
            });

        user.select("defs").select("pattern")
            .attr("x", function (d, i) {
                d.circleRadius = userCircleRadius;
                return d.preludePositionX + d.circleRadius;
            })
            .attr("y", function (d) {
                d.circleRadius = userCircleRadius;
                return d.preludePositionY + d.circleRadius;
            });

        user.select("circle")
            .attr("cx", function (d) {
                return d.preludePositionX;
            })
            .attr("cy", function (d) {
                return d.preludePositionY;
            });


    });
}