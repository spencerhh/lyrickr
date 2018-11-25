(function() {
    /* Need to...
    * 1. Only display lyrics if TasteDive doesn't have information (e.g. "Lil Baby")
    * 2. Create actual elements and insert into the content section instead of
    *       editing the innerHTML (possible solution to #1)
    * 3. Switch from the lyrics.ovh API to musixmatch
    * 4. Allow for related artists to be expanded
    * 5. Overall design updates
    * 6. Songkick API implementation
    */


    "use strict";

    const LYRIC_API_URL = "https://api.lyrics.ovh/v1/";
    const TASTEDIVE_API_URL = "https://tastedive.com/api/similar?callback=?";
    const TASTEDIVE_API_KEY = "324293-infomuse-4AWO4LX1";

    window.addEventListener("load", initialize);

    /**
     * Adds functionality to the search button and listens for the user hitting
     * the "enter" key for searches.
     */
    function initialize() {
        $("submit").addEventListener("click", searchLyrics);

        document.getElementById("artist-name")
            .addEventListener("keyup", function(event) {
                event.preventDefault();
                if (event.keyCode === 13) { // Code for the "enter" key
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


    /**
     * Retrieves the desired artist's name and song and makes the appropriate AJAX
     * request. Also invokes the searchSimilar function.
     */
    function searchLyrics() {
        searchSimilar();

        let artistName = $("artist-name").value;
        let songTitle = $("song-title").value;
        let url = LYRIC_API_URL + artistName + "/" + songTitle; // if no params needed in request url

        fetch(url, {
                mode: "cors"
            }) 
            .then(checkStatus) 
            .then(JSON.parse) 
            .then(displayLyrics) // Uses the retrieved JSON to display the song lyrics
            .catch(displayError); // Displays the error message
    }


    /**
     * Displays the song lyrics in the appropriate section. Unhides the other
     * content sections in case of a previous error message.
     * @param {JSON} responseData - JSON response from lyrics.ovh
     */
    function displayLyrics(responseData) {
        let lyrics = responseData.lyrics;

        let contentSections = qsa(".content-child");
        for (let i = 1; i < contentSections.length; i++) {
            contentSections[i].classList.remove("hidden");
        }

        $("lyrics-section").classList.remove("hidden");
        $("lyrics-display").innerHTML = lyrics;
    }


    /**
     * Hides other content sections and displays an error message. Adds an event
     * listener to the input boxes, which hides the error message.
     * @param {string} error - error from web service
     */
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


    /**
     * Hides the error message once the user clicks into the input boxes.
     */
    function hideLyrics() {
        $("lyrics-section").classList.add("hidden");
        $("artist-name").removeEventListener("click", hideLyrics);
        $("song-title").removeEventListener("click", hideLyrics);
    }


    /**
     * Retrieves the artist's name and makes an API call using jQuery, which retrieves data
     * about the artist and related artists. 
     */
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


    /**
     * Prints the artist's bio and other related artists in the remaining two content
     * sections.
     * @param {JSON} data - JSON data from TasteDive API
     */
    function displaySimilar(data) {
        let artistBio = data.Info[0].wTeaser;
        let artistWiki = data.Info[0].wUrl;
        $("artist-bio").innerHTML = artistBio + "\n" + artistWiki; // make this an element instead of innerHTML

        // console.log(data.Results);

        for (let i = 0; i < data.Results.length; i++) {
            let relatedArtist = document.createElement("li");
            relatedArtist.innerHTML = data.Results[i].Name + " (" + data.Results[i].wUrl + ")";
            $("related-artists").append(relatedArtist);
        }
    }


    /* ------------------------------ Helper Functions  ------------------------------ */

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