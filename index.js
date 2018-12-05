(function() {
    /* Need to...
     * 1. Create <a> tags for Wikipedia links
     * 2. Switch from the lyrics.ovh API to Musixmatch (check output for free access)
     * 3. Allow for related artists to be expanded (bios, links, etc.)
     * 4. Overall design updates
     * 5. Songkick API implementation
     * 6. Update comments
     * 7. Use some sort of global boolean for handling content creation and error messages
     */

    "use strict";

    let lyricsSuccess = true;

    // Base URLs and keys for APIs
    const API_URLS = {lyrics: "https://api.lyrics.ovh/v1/", 
        tastedive: "https://tastedive.com/api/similar?callback=?", 
        songkick: "https://api.songkick.com/api/3.0/search/artists.json?apikey={"};
    const API_KEYS = {tastedive: "324293-lyrickr-KFTB6MHP", songkick: "WT5YY3PAVZEiiiqv"};


    window.addEventListener("load", initialize);


    /**
     * Allows for data retrieval to be initiated with the "Search "button and enter key.
     */
    function initialize() {
        $("search").addEventListener("click", search);

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
     * Clears out any previous content and initiates the functions for data retrieval using
     * the values specified by the user.
     */
    function search() {
        let contentChildren = qsa(".content-child");
        contentChildren.forEach(function(child) {
            child.remove();
        });

        let artistName = $("artist-name").value;
        let songTitle = $("song-title").value;

        retrieveLyricsData(artistName, songTitle); // Uses the lyrics.ovh API
    }




    /* ------------------------------- Error Handling ------------------------------- */


    /**
     * Displays an error message for the user if all API retrievals fail and hides
     * the error message if the user clicks back into the input boxes.
     */
    function handleTotalError() {
        $("content-section").classList.remove("hidden");
        $("content-header").innerHTML = "sorry!";

        let errorDiv = document.createElement("div");
        errorDiv.classList.add("content-child");
        let errorMessage = document.createElement("p");
        errorMessage.innerHTML = "Unfortunately, we could not find any information for your request. Check your search and try again!";
        errorDiv.append(errorMessage);
        $("content-container").append(errorDiv);

        $("artist-name").addEventListener("click", hideContentSection);
        $("song-title").addEventListener("click", hideContentSection);
    }


    /**
     * Resets the content section after a total error has occurred.
     */
    function hideContentSection() {
        $("content-section").classList.add("hidden");
        $("content-header").innerHTML = "lyrics, bio, & related artists";

        $("artist-name").removeEventListener("click", hideContentSection);
        $("song-title").removeEventListener("click", hideContentSection);
    }




    /* ------------------------------- Lyrics.ovh API ------------------------------- */


    /**
     * Makes an AJAX call using the artist's name and song title. Success and failure
     * will both end up using the TasteDive API, but success will display the lyrics.
     * @param {string} artistName - artist name from the user
     * @param {string} songTitle - song title from the user
     */
    function retrieveLyricsData(artistName, songTitle) {
        let url = API_URLS.lyrics + artistName + "/" + songTitle;

        fetch(url, {
                mode: "cors"
            })
            .then(checkStatus)
            .then(JSON.parse)
            .then(displayLyricsData) 
            .catch(handleLyricsError); 
    }


    /**
     * Displays the lyrics on the page and initiates the TasteDive API call.
     * @param {JSON} responseData - JSON response from lyrics.ovh
     */
    function displayLyricsData(responseData) {
        lyricsSuccess = true; // Resets this value after possible previous total errors

        let lyricsData = responseData.lyrics;
        let lyrics = document.createElement("pre");
        lyrics.classList.add("content-child");
        lyrics.innerHTML = lyricsData;

        $("content-section").classList.remove("hidden");
        $("content-container").append(lyrics);

        retrieveTasteDiveData($("artist-name").value); // Uses the TasteDive API
    }


    /**
     * Sets the global lyricsSuccess boolean to false in case of TasteDive API failure.
     * Then attempts to use the TasteDive API.
     */
    function handleLyricsError() {
        lyricsSuccess = false;
        retrieveTasteDiveData($("artist-name").value);
    }




    /* -------------------------------- TasteDive API -------------------------------- */


    /**
     * Uses jQuery to request data about the user's specified artist. If this and the 
     * lyrics.ovh call failed, it will invoke the handleTotalError function. Success
     * of this function will display its data.
     * @param {string} artistName - artist name from the user
     * @return {boolean} false - if the retrieval fails
     * @return {object[]} tasteDiveData - TasteDive data if the retrieval succeeds
     */
    function retrieveTasteDiveData(artistName) {
        let query = {
            type: "music",
            k: API_KEYS.tastedive,
            q: artistName,
            limit: 10,
            info: 1
        };

        jQuery.getJSON(API_URLS.tastedive, query, function(data) {
            let result = data.Similar;
            if (result.Info[0].Type == "unknown") {
                if (lyricsSuccess == false) { 
                    handleTotalError();
                }
            } else {
                prepareTasteDiveData(result);
            }
        });
    }


    /**
     * Creates an object of elements ready to be appended to the document using the 
     * data returned from the TasteDive API. Passes this object to displayTasteDiveData
     * to be displayed.
     * @param {JSON} data - JSON data from TasteDive API
     */
    function prepareTasteDiveData(data) {
        let tasteDiveData = {};

        let artistBio = data.Info[0].wTeaser;
        let artistWiki = data.Info[0].wUrl;
        artistBio = artistBio + "\n" + artistWiki; 

        let artistBioP = document.createElement("p");
        artistBioP.innerHTML = artistBio;
        let artistBioDiv = document.createElement("div");
        artistBioDiv.classList.add("content-child");
        artistBioDiv.append(artistBioP);
        tasteDiveData[0] = artistBioDiv;

        // Stores individual <li> elements in the rest of the tasteDiveData object
        for (let i = 0; i < data.Results.length; i++) {
            let relatedArtist = document.createElement("li");
            relatedArtist.innerHTML = data.Results[i].Name + " (" + data.Results[i].wUrl + ")";
            tasteDiveData[i + 1] = relatedArtist;
        }

        displayTasteDiveData(tasteDiveData);
    }


    /**
     * Prepares the content section for display and then appends the content-container with 
     * the elements containg the TasteDive data.
     * @param {object[]} data - object full of elements with TasteDive data
     */
    function displayTasteDiveData(data) {

        // Possibly needs a case for artist's with no bio, but related artists

        if($("content-section").classList.contains("hidden")) {
            $("content-section").classList.remove("hidden");
        }
        $("content-header").innerHTML = "lyrics, bio, & related artists";

        $("content-container").append(data[0]); // Artist's bio

        if(data[1] != undefined) { // Handles case for artists without related artists, but have bios
            let relatedArtistsSection = document.createElement("div");
            relatedArtistsSection.classList.add("content-child");
            let relatedArtistsList = document.createElement("ul");
            for (let i = 1; i < 11; i++) {
                relatedArtistsList.append(data[i]);
            }

            relatedArtistsSection.append(relatedArtistsList);
            $("content-container").append(relatedArtistsSection);
        }
    }




    /* -------------------------------- Songkick API -------------------------------- */





    /* ------------------------------- Musixmatch API ------------------------------- */




    /* ------------------------------ Helper Functions ------------------------------ */

    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} id - element ID
     * @returns {object} DOM object associated with id.
     */
    function $(id) {
        return document.getElementById(id);
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