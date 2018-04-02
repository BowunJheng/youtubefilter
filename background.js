const TAGS = 'YOUTUBEKEYWORD';
var blackList = [];
var ACTION = {
    ADD: 0,
    DEL: 1
};

chrome.webNavigation.onCompleted.addListener(function(details) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.executeScript(details.tabId, {
            code: 'blackListFilter("' + tab.title + '",1);'
        });
    });
}, {
    url: [{
        hostContains: '.youtube.'
    }],
});

var lastTitle = "";
chrome.tabs.onUpdated.addListener(function(tabid, changeinfo, tab) {
    if (tab.url !== undefined && lastTitle != tab.title) {
        var urlArray = tab.url.split('/');
        if (urlArray[2].indexOf('.youtube.') != -1) {
            chrome.tabs.query({
                active: true,
                lastFocusedWindow: true
            }, function(array_of_Tabs) {
                chrome.tabs.update(tabid, {
                    selected: true
                });
                chrome.tabs.executeScript(tabid, {
                    code: 'blackListFilter("' + tab.title + '",3);'
                });
                chrome.tabs.update(array_of_Tabs[0].id, {
                    selected: true
                });
            });
        }
        lastTitle = tab.title;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    getKeywordListInDom(0);
    document.getElementById('button').addEventListener('click', function(event) {
        modidyBlackList(ACTION.ADD, event);
    });
    document.getElementById('list').addEventListener('click', getOneRecord);
    document.getElementById('delbtn').addEventListener('click', function(event) {
        modidyBlackList(ACTION.DEL, event);
    });
});

function simulateShiftN() {
    function injected() {
        var element = document.body;

        function keyEvent(el, ev) {
            var eventObj = document.createEvent("Events");
            eventObj.initEvent(ev, true, true);
            eventObj.keyCode = 78;
            eventObj.which = 78;
            eventObj.ctrlKey = false;
            eventObj.shiftKey = true;
            eventObj.altKey = false;
            el.dispatchEvent(eventObj);
        }
        keyEvent(element, "keydown");
        keyEvent(element, "keypress");
        setTimeout(function() {
            keyEvent(element, "keyup");
        }, 200);
    }
    var script = document.createElement('script');
    script.textContent = "(" + injected.toString() + ")();";
    (document.head || document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);
}

function blackListFilter(currTitle, whichEvent) {
    chrome.storage.local.get(TAGS, function(blacklist) {
        if (chrome.runtime.lastError) {
            console.log("Error retrieving index: " + chrome.runtime.lastError);
            return;
        }
        var skipthisone = 0;
        blacklist[TAGS].every(function(item) {
            if (currTitle.indexOf(item) != -1) {
                skipthisone = 1;
                return false;
            }
            return true;
        });
        if (skipthisone == 1) {
            setTimeout(function() {
                simulateShiftN();
            }, 2000);
        }
    });
}

function refreshBlackList() {
    var obj = {};
    var values = [];
    blackList.forEach(function(item) {
        values.push(item);
    });
    obj[TAGS] = values;
    chrome.storage.local.set(obj, function() {
        if (chrome.runtime.lastError) {
            console.log("Error retrieving index: " + chrome.runtime.lastError);
            return;
        }
    });
    document.getElementsByName("keyword")[0].value = "";
}

function modidyBlackList(type, event) {
    var x = document.getElementsByName("keyword")[0].value.trim();
    console.log(type);
    if (x.length == 0) return;
    var finditemindex = blackList.indexOf(x);
    var setoffset = 1;
    if (finditemindex == -1) {
        if (type == ACTION.ADD) {
            blackList.push(x);
            refreshBlackList();
            setoffset = blackList.length;
        }
    } else {
        if (type == ACTION.DEL) {
            blackList.splice(finditemindex, 1);
            refreshBlackList();
            setoffset = finditemindex;
            if (blackList.length != 0)
                document.getElementsByName("keyword")[0].value = document.getElementById('listdata').options[setoffset - 1].text;
        } else {
            setoffset = finditemindex + 1;
        }
    }
    getKeywordListInDom(setoffset);
}

function getKeywordListInDom(offset) {
    document.getElementById("div").innerHTML = "<h3>Keyword BlackList</h3>";
    chrome.storage.local.get(TAGS, function(blacklist) {
        if (chrome.runtime.lastError) {
            console.log("Error retrieving index: " + chrome.runtime.lastError);
            return;
        }
        var txt = "<select id='listdata' size='10' style='width: 300px;'>";
        var counter = 0;
        blackList = [];
        blacklist[TAGS].forEach(function(item) {
            var btnname = "delbtn" + counter.toString();
            txt += "<option value='" + (counter++) + ((counter == offset) ? "' selected>" : "'>") + item + "<br/>";
            blackList.push(item);
        });
        txt += "</select>";
        document.getElementById("list").innerHTML = txt;
    });
}

function getOneRecord() {
    if (document.getElementById('listdata')) {
        document.getElementsByName("keyword")[0].value = document.getElementById('listdata').options[document.getElementById('listdata').value].text;
    }
}
