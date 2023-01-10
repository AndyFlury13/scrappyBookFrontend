import { drawTreeMap } from "./treeMap.js";
import { 
    clientPicturedWithSVG, 
    clientTakerSubjectSVG, 
    drawNetwork, 
    ICON_DATA,
    totalPWSVG,
    totalTSSVG
} from "./networkGraphs.js";
import { displayStats } from './stats.js';
import { drawBarGraph } from "./monthGraph.js";
import { drawTop3Stats, columnOneColors, columnTwoColors, columnThreeColors } from "./top3Stats.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, getDocFromServer, getFirestore, getDocs, collection } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";


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
        console.log(albums);
        albums.forEach((album) => {
            if (album.title === 'iconPhotos') { // load icon album
                return gapi.client.photoslibrary.mediaItems.search({
                    albumId: album.id,
                    pageSize: 13,
                }).then((mediaResponse) => {
                    // do stuff here
                    const { mediaItems } = mediaResponse.result;
                    console.log(mediaItems);
                    mediaItems.forEach((mediaItem) => {
                        ICON_DATA.push({
                            name: mediaItem.description,
                            url: mediaItem.baseUrl,
                        });
                    });

                    const storage = getStorage(app);
                    console.log(storage);
                    console.log(app);
                    displayStats(clientName, storage);

                    drawTop3Stats(clientName, 'picturedWith', 'picturedWithTop3', columnOneColors, storage);
                    drawTop3Stats(clientName, 'subjectTaker', 'asSubjectTop3', columnTwoColors, storage);
                    drawTop3Stats(clientName, 'takerSubject', 'asPhototakerTop3', columnThreeColors, storage);
                    drawBarGraph(clientName, 'photoTaker', storage);
                    drawTreeMap(clientName, storage);
                    drawNetwork(clientName, 'picturedWith', clientPicturedWithSVG, 'clientPicturedWith', storage);
                    drawNetwork(clientName, 'takerSubject', clientTakerSubjectSVG, 'clientTakerSubject', storage);
                    drawNetwork('totalPW', 'picturedWith', totalPWSVG, 'totalPW', storage);
                    drawNetwork('totalTS', 'takerSubject', totalTSSVG, 'totalTS', storage);
                    
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
    console.log('emulator test');
    $('.fbAuthenticateBtn').fadeOut("slow", () => {
        // $('.loader').fadeIn("slow");
        // signInWithPopup(auth, provider).then(async (result) => {
            // console.log(result);
            // console.log(result.user.email);
            // const clientName = emailToClientName[result.user.email];
            // console.log(clientName);
            // const db = getFirestore(app, {
                // 'experimentalForceLongPolling': true
            // });

            // const querySnapshot = await getDocs(collection(db, "cities"));
            // querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
                // console.log(doc.id, " => ", doc.data());
            // });
            console.log('1');
            // const docRef = doc(db, "topSneaky", "secretsSHHHH");
            // console.log('2');
            // const docSnap = getDocFromServer(docRef);
            // console.log('3');
            // console.log(docSnap);
            // docSnap.then((doc) => {
                // console.log('4');
                const credentials = {
                    'gpClientID':'830400570958-97dlsn4388cdurn04deasb00fui1ouq3.apps.googleusercontent.com',
                    'gpAPIKey': 'AIzaSyAEwGaqEu8QpFsZKaJQSzn1l-jCtgkknsY'
                };
                console.log(credentials);
                // $('.loader').fadeOut("slow", () => {
                    $('.gpAuthenticateBtn').fadeIn(3000);
                    $('.gpAuthenticateBtn').on('click', () => {
                        // $('.gpAuthenticateBtn').fadeOut(1000, () => {
                        //     $('.loader').fadeIn();
                        // });
                        const clientName= 'me';
                        gapi.load('client:auth2', () => {
                            gapi.auth2.init({ client_id: credentials.gpClientID });
                            authenticate().then(() => {
                                loadClient(credentials, clientName);
                                $('.authenticateSection').fadeOut('fast', () => {
                                    $('.scroller').fadeIn("slow");
                                });
                            });
                        });  
                    // });
                // });
                
            // });
        });
    });
});