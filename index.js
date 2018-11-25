(function() {
    /* Need to...
    * 1. Only display lyrics if TasteDive doesn't have information (e.g. "Lil Baby")
    *       and clear out old content sections (e.g. "Lil Baby" -> "Drake")
    * 2. Create actual elements and insert into the content section instead of
    *       editing the innerHTML (possible solution to #1)
    * 3. Switch from the lyrics.ovh API to musixmatch
    * 4. Allow for related artists to be expanded
    * 5. Overall design updates
    * 6. Songkick API implementation
    */




    /*
    search->retrieve lyrics & retrieve similar->display if one succeeds and error if none->if error, reset on click
    instead of display, should be retrieval with returned data
    */


    "use strict";

    //let globalLyricsFail = false;

    const LYRIC_API_URL = "https://api.lyrics.ovh/v1/";
    const TASTEDIVE_API_URL = "https://tastedive.com/api/similar?callback=?";
    const TASTEDIVE_API_KEY = "324293-infomuse-4AWO4LX1";

    window.addEventListener("load", initialize);

    /**
     * Adds functionality to the search button and listens for the user hitting
     * the "enter" key for searches.
     */
    function initialize() {
        $("submit").addEventListener("click", retrieveDataFromRequest);

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


    function retrieveDataFromRequest() {
        // Kills off all previous children
        let contentChildren = qsa("content-child");
        for(let i = 0; i < contentChildren.length; i++) {
            contentChildren[i].remove();
        }

        let artistName = $("artist-name").value;
        let songTitle = $("song-title").value;




        // lyrics-> false || pre element
        let lyricsData = retrieveLyrics(artistName, songTitle); // Uses the lyrics.ovh API
        let tasteDiveData = retireveTasteDive(artistName); // Uses the TasteDive API


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

    function handleError() {
        $("content-section").classList.remove("hidden");
        $("content-header").innerHTML = "Sorry!";
        let errorMessage = document.createElement("p");
        errorMessage.id = "error-message";
        errorMessage.innerHTML = "Unfortunately, we could not find any data for your request. Check your search and try again!";
        $("content-container").append(errorMessage);

        $("artist-name").addEventListener("click", hideContentSection);
        $("song-title").addEventListener("click", hideContentSection);

    }

    function hideContentSection() {
        $("content-section").classList.add("hidden");
        $("content-header").innerHTML = "lyrics, bio, & related artists";
        document.remove("error-message"); // possibly redundant due to killing all children above

        $("artist-name").removeEventListener("click", hideContentSection);
        $("song-title").removeEventListener("click", hideContentSection);
    }




    /**
     * Retrieves the desired artist's name and song and makes the appropriate AJAX
     * request. Also invokes the searchSimilar function.
     */
    function retrieveLyrics(artistName, songTitle) {
        let url = LYRIC_API_URL + artistName + "/" + songTitle; // if no params needed in request url

        fetch(url, {
                mode: "cors"
            }) 
            .then(checkStatus) 
            .then(JSON.parse) 
            .then(returnLyrics) // Uses the retrieved JSON to display the song lyrics
            .catch(return false); // Returns false to the main function
    }

    /**
     * Displays the song lyrics in the appropriate section. Unhides the other
     * content sections in case of a previous error message.
     * @param {JSON} responseData - JSON response from lyrics.ovh
     */
    function returnLyrics(responseData) {
        let lyricsData = responseData.lyrics;

        /*let contentSections = qsa(".content-child");
        for (let i = 1; i < contentSections.length; i++) {
            contentSections[i].classList.remove("hidden");
        }*/

        // $("content-section").classList.remove("hidden");


        // create a pre element and append it to the content section
        let lyrics = document.createElement("pre");
        lyrics.classList.add("content-child");
        lyrics.innerHTML = lyricsData;
        

        return lyrics;
    }


    /**
     * Retrieves the artist's name and makes an API call using jQuery, which retrieves data
     * about the artist and related artists. 
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



    function displayTasteDiveData(data) {

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