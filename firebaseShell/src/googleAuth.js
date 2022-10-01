import { drawTreeMap } from "./treeMap.js";
import { ICON_DATA } from "./networkGraphs.js";
import { drawBarGraph } from "./monthGraph.js";
import { drawNetwork } from "./networkGraphs.js";
import { clientPicturedWithSVG } from "./networkGraphs.js";
import { clientTakerSubjectSVG } from "./networkGraphs.js";
import { totalPWSVG } from "./networkGraphs.js";
import { totalTSSVG } from "./networkGraphs.js";
import { drawTop3Stats } from "./top3Stats.js";
import { columnOneColors } from "./top3Stats.js";
import { columnTwoColors } from "./top3Stats.js";
import { columnThreeColors } from "./top3Stats.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";

const authenticate = () => gapi.auth2.getAuthInstance()
.signIn({ scope: 'https://www.googleapis.com/auth/photoslibrary https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata' })
.then(
    () => { console.log('Sign-in successful'); },
    (err) => { console.error('Error signing in', err); },
);

const loadGraphs = (clientName) => {
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
                    drawNetwork(clientName, 'picturedWith', clientPicturedWithSVG, 'clientPicturedWith');
                    drawNetwork(clientName, 'takerSubject', clientTakerSubjectSVG, 'clientTakerSubject');
                    drawNetwork('totalPW', 'picturedWith', totalPWSVG, 'totalPW');
                    drawNetwork('totalTS', 'takerSubject', totalTSSVG, 'totalTS');
                    drawTop3Stats(clientName, 'picturedWith', 'picturedWithTop3', columnOneColors);
                    drawTop3Stats(clientName, 'subjectTaker', 'asSubjectTop3', columnTwoColors);
                    drawTop3Stats(clientName, 'takerSubject', 'asPhototakerTop3', columnThreeColors);
                    drawTreeMap(clientName);
                    drawBarGraph(clientName, 'photoTaker');
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
    }, (err) => {
        console.error('Execute error', err);
    });
};

const emailToClientName = {
    'andrewflury@berkeley.edu':'me',
    'shirleywang57@berkeley.edu': 'shirleyWhirley',
    'justintwong@berkeley.edu': 'yuppie',
    'ericgai@berkeley.edu': 'dumbestKid',
    'victorjann@berkeley.edu': 'bugBoy',
    'katherine.wei@berkeley.edu': 'girlBoss',
    'jiuchang@berkeley.edu': 'jiusus',
    'chinmayee_vw@berkeley.edu': 'chimu',
    'ezhang10@berkeley.edu': 'emily'
}


const loadClient = (credentials, clientName) => {
    gapi.client.setApiKey(credentials.gpAPIKey);
    return gapi.client.load('https://photoslibrary.googleapis.com/$discovery/rest?version=v1').then(() => {
        loadGraphs(clientName);
    }, (err) => {
        console.error('Error loading GAPI client for API', err);
    });
};

const firebaseConfig = {
    apiKey: "AIzaSyA9NRou3rxQKTmXFG5Cfjt7MuFVjbKKc0k",
    authDomain: "scrappybook-1c62c.firebaseapp.com",
    projectId: "scrappybook-1c62c",
    storageBucket: "scrappybook-1c62c.appspot.com",
    messagingSenderId: "243358959783",
    appId: "1:243358959783:web:d1342a46babd657d0e3382",
    measurementId: "G-54W0TJJYHJ"
};
const app = initializeApp(firebaseConfig);
var provider = new GoogleAuthProvider();
const auth = getAuth(app);

$('.fbAuthenticateBtn').on('click', () => {
    $('.fbAuthenticateBtn').fadeOut("slow", () => {
        $('.loader').fadeIn("slow");
        signInWithPopup(auth, provider).then((result) => {
            console.log(result);
            // const credential = GoogleAuthProvider.credentialFromResult(result);
            const clientName = emailToClientName[result.user.email];
            const db = getFirestore(app);
            const docRef = doc(db, "topSneaky", "secretsSHHHH");
            const docSnap = getDoc(docRef);
            docSnap.then((doc) => {
                const credentials = doc.data()
                $('.loader').fadeOut("slow", () => {
                    $('.gpAuthenticateBtn').fadeIn("slow");
                    $('.gpAuthenticateBtn').on('click', () => {
                        $('.gpAuthenticateBtn').fadeOut("slow");
                        $('.loader').fadeIn();
                        gapi.load('client:auth2', () => {
                            gapi.auth2.init({ client_id: credentials.gpClientID });
                            authenticate().then(() => {
                                loadClient(credentials, clientName);
                            });
                        });  
                    });
                });
                
            });
        });
    });
});
