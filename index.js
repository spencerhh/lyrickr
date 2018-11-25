// Spencer Hall
// Updated: 11.21.2018
//
// -- your description of what this file does here --
//
(function() {
    "use strict";

    const LYRIC_API_URL = "https://api.lyrics.ovh/v1/";
    const TASTEDIVE_API_URL = "https://tastedive.com/api/similar?callback=?";
    const TASTEDIVE_API_KEY = "324293-infomuse-4AWO4LX1";

    window.addEventListener("load", initialize);


    function initialize() {
        $("submit").addEventListener("click", searchLyrics);

        document.getElementById("artist-name")
            .addEventListener("keyup", function(event) {
                event.preventDefault();
                if (event.keyCode === 13) {
                    document.getElementById("submit").click();
                }
            });

        document.getElementById("song-title")
            .addEventListener("keyup", function(event) {
                event.preventDefault();
                if (event.keyCode === 13) {
                    document.getElementById("submit").click();
                }
            });

    }


    function searchLyrics() {
        searchSimilar();


        let artistName = $("artist-name").value;
        let songTitle = $("song-title").value;
        let url = LYRIC_API_URL + artistName + "/" + songTitle; // if no params needed in request url

        fetch(url, {
                mode: "cors"
            }) // mode cors (cross-origin request service) for talking with our web services
            .then(checkStatus) // helper function provide to ensure request is successful or not
            .then(JSON.parse) // uncomment if response returns JSON format instead of text
            .then(displayLyrics) // this is reached if checkStatus says good-to-go; you write this function
            .catch(displayError); // this is reached if error happened down the fetch chain pipeline, 
    }


    function displayLyrics(responseData) {
        let lyrics = responseData.lyrics;

        let contentSections = qsa(".content-child");
        for (let i = 1; i < contentSections.length; i++) {
            contentSections[i].classList.remove("hidden");
        }
        $("lyrics-section").classList.remove("hidden");
        $("lyrics-display").innerHTML = lyrics;
    }


    function displayError(error) {
        $("lyrics-section").classList.remove("hidden");
        let contentSections = qsa(".content-child");
        for (let i = 1; i < contentSections.length; i++) {
            contentSections[i].classList.add("hidden");
        }
        $("lyrics-display").innerHTML = "Sorry, I couldn't find your song!";

        $("artist-name").addEventListener("click", hideLyrics);
        $("song-title").addEventListener("click", hideLyrics);
    }


    function hideLyrics() {
        $("lyrics-section").classList.add("hidden");
        $("artist-name").removeEventListener("click", hideLyrics);
        $("song-title").removeEventListener("click", hideLyrics);
    }



    function searchSimilar() {
        let artistQuery = $("artist-name").value;
        let query = {
            type: "music",
            k: TASTEDIVE_API_KEY,
            q: artistQuery,
            limit: 10,
            info: 1
        };

        jQuery.getJSON(TASTEDIVE_API_URL, query, function(data) {
            let result = data.Similar;
            displaySimilar(result);
        });
    }

    function displaySimilar(data) {
        let artistBio = data.Info[0].wTeaser;
        let artistWiki = data.Info[0].wUrl;
        $("artist-bio").innerHTML = artistBio + "\n" + artistWiki; // make this an element instead of innerHTML

        console.log(data.Results);
        console.log(data.Results[0].Name);
        console.log(data.Results[0].wUrl);

        for (let i = 0; i < data.Results.length; i++) {
            let relatedArtist = document.createElement("li");
            relatedArtist.innerHTML = data.Results[i].Name + " (" + data.Results[i].wUrl + ")";
            $("related-artists").append(relatedArtist);
        }
    }



    /* ------------------------------ Helper Functions  ------------------------------ */
    // Note: You may use these in your code, but do remember that your code should not have
    // any functions defined that are unused.

    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} id - element ID
     * @returns {object} DOM object associated with id.
     */
    function $(id) {
        return document.getElementById(id);
    }

    /**
     * Returns the first element that matches the given CSS selector.
     * @param {string} query - CSS query selector.
     * @returns {object} The first DOM object matching the query.
     */
    function qs(query) {
        return document.querySelector(query);
    }

    /**
     * Returns the array of elements that match the given CSS selector.
     * @param {string} query - CSS query selector
     * @returns {object[]} array of DOM objects matching the query.
     */
    function qsa(query) {
        return document.querySelectorAll(query);
    }

    /*
     * Helper function to return the response's result text if successful, otherwise
     * returns the rejected Promise result with an error status and corresponding text
     * @param {object} response - response to check for success/error
     * @returns {object} - valid result text if response was successful, otherwise rejected
     *                     Promise result
     */
    function checkStatus(response) {
        if (response.status >= 200 && response.status < 300 || response.status == 0) {
            return response.text();
        } else {
            return Promise.reject(new Error(response.status + ": " + response.statusText));
        }
    }

})();