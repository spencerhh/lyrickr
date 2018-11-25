(function() {
    /* Need to...
    * 1. Create <a> tags for Wikipedia links
    * 2. Switch from the lyrics.ovh API to musixmatch
    * 3. Allow for related artists to be expanded
    * 4. Overall design updates
    * 5. Songkick API implementation
    */


    "use strict";

    // API URLs and keys
    const LYRIC_API_URL = "https://api.lyrics.ovh/v1/";
    const TASTEDIVE_API_URL = "https://tastedive.com/api/similar?callback=?";
    const TASTEDIVE_API_KEY = "324293-infomuse-4AWO4LX1";


    window.addEventListener("load", initialize);


    /**
     * Invokes data retrieval once the search button is clicked and allows
     * for the "enter" key to invoke retrieval.
     */
    function initialize() {
        $("search").addEventListener("click", retrieveDataFromRequest);

        document.getElementById("artist-name")
            .addEventListener("keyup", function(event) {
                event.preventDefault();
                if (event.keyCode === 13) { // Code for the "enter" key
                    document.getElementById("search").click();
                }
            });

        document.getElementById("song-title")
            .addEventListener("keyup", function(event) {
                event.preventDefault();
                if (event.keyCode === 13) {
                    document.getElementById("search").click();
                }
            });
    }


    /**
     * Clears out any previous content and initiates the functions for data retrieval.
     * Then displays the retrieved data or produces an error message (only if all
     * retrievals fail).
     */
    function retrieveDataFromRequest() {
        // Clears out previous content
        let contentChildren = qsa(".content-child");
        for(let i = 0; i < contentChildren.length; i++) {
            document.remove(contentChildren[i]);
        }

        let artistName = $("artist-name").value;
        let songTitle = $("song-title").value;

        // If the retrieval fails, these variables will contain a value of "false"
        let lyricsData = retrieveLyrics(artistName, songTitle); // Uses the lyrics.ovh API
        let tasteDiveData = retrieveTasteDive(artistName); // Uses the TasteDive API

        if(!lyricsData && !tasteDiveData) {
            handleError();
        } else {
            $("content-section").classList.remove("hidden");
            if(!lyricsData) {
                $("content-container").append(lyricsData);
            } else if(!tasteDiveData) {
                displayTasteDiveData(tasteDiveData);
            }
        }
    }


    /**
     * Displays an error message for the user if all retrievals fail and hides
     * the error message if the user clicks back into the input boxes.
     */
    function handleError() {
        $("content-section").classList.remove("hidden");
        $("content-header").innerHTML = "sorry!";

        let errorDiv = document.createElement("div");
        let errorMessage = document.createElement("p");
        errorMessage.innerHTML = "Unfortunately, we could not find any information for your request. Check your search and try again!";
        errorDiv.append(errorMessage);
        $("content-container").append(errorDiv);

        $("artist-name").addEventListener("click", hideContentSection);
        $("song-title").addEventListener("click", hideContentSection);
    }


    /**
     * Resets the content section after an error has occurred.
     */
    function hideContentSection() {
        $("content-section").classList.add("hidden");
        $("content-header").innerHTML = "lyrics, bio, & related artists";

        $("artist-name").removeEventListener("click", hideContentSection);
        $("song-title").removeEventListener("click", hideContentSection);
    }


    /**
     * Makes an AJAX call using the artist's name and song title.
     * @param {string} artistName - artist name from the user
     * @param {string} songTitle - song title from the user
     * @returns {boolean} false - if the retrieval fails
     * @returns {el} lyrics - lyrics data if the retrieval succeeds
     */
    function retrieveLyrics(artistName, songTitle) {
        let url = LYRIC_API_URL + artistName + "/" + songTitle; 

        fetch(url, {
                mode: "cors"
            }) 
            .then(checkStatus) 
            .then(JSON.parse) 
            .then(return returnLyrics) // Returns the lyrics to the main function
            .catch(return false); // Returns false to the main function
    }


    /**
     * Retrieves the lyrics and returns them in a <pre> element.
     * @param {JSON} responseData - JSON response from lyrics.ovh
     * @return {el} lyrics - JSON response converted into a <pre> element
     */
    function returnLyrics(responseData) {
        let lyricsData = responseData.lyrics;
        let lyrics = document.createElement("pre");
        lyrics.classList.add("content-child");
        lyrics.innerHTML = lyricsData;
        return lyrics;
    }


    /**
     * Uses jQuery to request data about the user's specified artist. It returns false
     * to the main function if the request fails and returns the desired data if it
     * succeeds.
     * @param {string} artistName - artist name from the user
     * @return {boolean} false - if the retrieval fails
     * @return {object[]} tasteDiveData - TasteDive data if the retrieval succeeds
     */
    function retrieveTasteDive(artistName) {
        let query = {
            type: "music",
            k: TASTEDIVE_API_KEY,
            q: artistName,
            limit: 10,
            info: 1
        };

        jQuery.getJSON(TASTEDIVE_API_URL, query, function(data) {
            let result = data.Similar;
            if(result == undefined) {
                return false;
            } else {
                return returnTasteDive(result);
            }
        });
    }


    /**
     * Prints the artist's bio and other related artists in the remaining two content
     * sections.
     * @param {JSON} data - JSON data from TasteDive API
     */
    function returnTasteDive(data) {
        let tasteDiveData = {};

            let artistBio = data.Info[0].wTeaser;
            let artistWiki = data.Info[0].wUrl;
            let artistBio = artistBio + "\n" + artistWiki; // make this an element instead of innerHTML
            let artistBioDiv = document.createElement("div");
            artistBioDiv.id = "artist-bio";
            artistBioDiv.classList.add("content-child");
            let artistBioP = document.createElement("p");
            artistBioP.innerHTML = artistBio;
            artistBioDiv.append(artistBioP);
            tasteDiveData[0] = artistBioDiv;


            for (let i = 0; i < data.Results.length; i++) {
                let relatedArtist = document.createElement("li");
                relatedArtist.innerHTML = data.Results[i].Name + " (" + data.Results[i].wUrl + ")";
                tasteDiveData[i+1] = relatedArtist;
            }

            return tasteDiveData;
        }
    }


    /**
     * Displays the song lyrics in the appropriate section. Unhides the other
     * content sections in case of a previous error message.
     * @param {JSON} responseData - JSON response from lyrics.ovh
     */
    function displayTasteDiveData(data) {
        // data is an array where [0] is the artist bio and [1-10] are related artists
        $("content-container").append(data[0]);
        let relatedArtistsSection = document.createElement("div");
        let relatedArtistsList = document.createElement("ul");
        relatedArtistsSection.append(relatedArtistsList);
        $("content-container").append(relatedArtistsSection);

        for (let i = 1; i < data.length; i++) {
            $("content-container").append(data[i]);
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