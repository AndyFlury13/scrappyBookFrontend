/* global
    drawNetwork,
    ICON_DATA,
    clientPicturedWithSVG,
    clientTakerSubjectSVG,
    totalPWSVG,
    totalTSSVG,
    CREDENTIALS,
    drawNetwork
    drawTop3Stats
    columnOneColors,
    columnTwoColors,
    columnThreeColors
    drawTreeMap
    drawBarGraph
*/
const CLIENT_NAME = 'me';

/**
 * Sample JavaScript code for photoslibrary.mediaItems.get
 * See instructions for running APIs Explorer code samples locally:
 * https://developers.google.com/explorer-help/code-samples#javascript
 */


const loadIconPhotos = async () => {
  console.log('GAPI client loaded for API');
  return gapi.client.photoslibrary.albums.list({})
    .then((albumsResponse) => {
      const { albums } = albumsResponse.result;
      albums.forEach((album) => {
        if (album.title === 'iconPhotos') { // load icon album
          return gapi.client.photoslibrary.mediaItems.search({
            albumId: album.id,
            pageSize: 13,
          }).then((mediaResponse) => {
            // do stuff here
            const { mediaItems } = mediaResponse.result;
            mediaItems.forEach((mediaItem) => {
              ICON_DATA.push({
                name: mediaItem.description,
                url: mediaItem.baseUrl,
              });
            });
            drawNetwork(CLIENT_NAME, 'picturedWith', clientPicturedWithSVG, 'clientPicturedWith');
            drawNetwork(CLIENT_NAME, 'takerSubject', clientTakerSubjectSVG, 'clientTakerSubject');
            drawNetwork('totalPW', 'picturedWith', totalPWSVG, 'totalPW');
            drawNetwork('totalTS', 'takerSubject', totalTSSVG, 'totalTS');

            drawTop3Stats(CLIENT_NAME, 'picturedWith', 'picturedWithTop3', columnOneColors);
            drawTop3Stats(CLIENT_NAME, 'subjectTaker', 'asSubjectTop3', columnTwoColors);
            drawTop3Stats(CLIENT_NAME, 'takerSubject', 'asPhototakerTop3', columnThreeColors);

            drawTreeMap(CLIENT_NAME);
            drawBarGraph(CLIENT_NAME, 'photoTaker');

            // TODO
            while ('nextPageToken' in mediaResponse) {
              console.log('todo');
            }
          }, (err) => {
            console.error('Error loading album client for API', err);
          });
        }
      });
      $('.loader').fadeOut();
      $('.hdPwdInput').fadeIn(1000);
    }, (err) => {
      console.error('Execute error', err);
    });
};



// gapi.load('client:auth2', () => {
//   gapi.auth2.init({ client_id: CREDENTIALS.clientID });
// });

// $('#authenticateButton').click(() => {
//   authenticate().then(loadClient);
//   $('#authenticateButton').fadeOut();
//   $('.loader').fadeIn();
// });

// Import the functions you need from the SDKs you need
const initializeApp = require("https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js");
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-analytics.js";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries
// import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
// import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyA9NRou3rxQKTmXFG5Cfjt7MuFVjbKKc0k",
//   authDomain: "scrappybook-1c62c.firebaseapp.com",
//   projectId: "scrappybook-1c62c",
//   storageBucket: "scrappybook-1c62c.appspot.com",
//   messagingSenderId: "243358959783",
//   appId: "1:243358959783:web:d1342a46babd657d0e3382",
//   measurementId: "G-54W0TJJYHJ"
// };


// const loadClient = async (credentials) => {
// gapi.client.setApiKey(credentials.gpAPIKey);
// return gapi.client.load('https://photoslibrary.googleapis.com/$discovery/rest?version=v1')
//     .then(
//     () => {
//         loadIconPhotos();
//     },
//     (err) => {
//         console.error('Error loading GAPI client for API', err);
//     },
//     );
// };