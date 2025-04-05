//theoretical use of history permission in order to get URLs
//less than optimal
//search continues

// Search history to find up to ten links that a user has typed in,
// and show those links in a popup.
function buildTypedUrlList(divName) {
    // To look for history items visited in the last week,
    // subtract a week of milliseconds from the current time.
    let millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
    let oneWeekAgo = new Date().getTime() - millisecondsPerWeek;

    // Track the number of callbacks from chrome.history.getVisits()
    // that we expect to get.  When it reaches zero, we have all results.
    let numRequestsOutstanding = 0;

    chrome.history.search(
        {
            text: '', // Return every history item....
            startTime: oneWeekAgo // that was accessed less than one week ago.
        },
        function (historyItems) {
            // For each history item, get details on all visits.
            for (let i = 0; i < historyItems.length; ++i) {
                let url = historyItems[i].url;
                let processVisitsWithUrl = function (url) {
                    // We need the url of the visited item to process the visit.
                    // Use a closure to bind the  url into the callback's args.
                    return function (visitItems) {
                        processVisits(url, visitItems);
                    };
                };
                chrome.history.getVisits({ url: url }, processVisitsWithUrl(url));
                numRequestsOutstanding++;
            }
            if (!numRequestsOutstanding) {
                onAllVisitsProcessed();
            }
        }
    );

    // Maps URLs to a count of the number of times the user typed that URL into
    // the omnibox.
    let urlToCount = {};

    // Callback for chrome.history.getVisits().  Counts the number of
    // times a user visited a URL by typing the address.
    const processVisits = function (url, visitItems) {
        for (let i = 0, ie = visitItems.length; i < ie; ++i) {
            // Ignore items unless the user typed the URL.
            if (visitItems[i].transition != 'typed') {
                continue;
            }

            if (!urlToCount[url]) {
                urlToCount[url] = 0;
            }

            urlToCount[url]++;
        }

        // If this is the final outstanding call to processVisits(),
        // then we have the final results.  Use them to build the list
        // of URLs to show in the popup.
        if (!--numRequestsOutstanding) {
            onAllVisitsProcessed();
        }
    };

    // This function is called when we have the final list of URls to display.
    const onAllVisitsProcessed = () => {
        // Get the top scorring urls.
        let urlArray = [];
        for (let url in urlToCount) {
            urlArray.push(url);
        }

        // Sort the URLs by the number of times the user typed them.
        urlArray.sort(function (a, b) {
            return urlToCount[b] - urlToCount[a];
        });

        newWin = window.open()
        newWin.document.write(urlArray)
    };
}

document.addEventListener('DOMContentLoaded', function () {
    buildTypedUrlList('typedUrl_div');
});