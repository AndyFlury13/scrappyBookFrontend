import { drawDonut } from "./donut.js";
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
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

let CLIENT_NAME;
let CREDENTIALS;
let tokenClient;

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


$( window ).on('load', () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '830400570958-cjqakcuq9hcidb5btmmikoe4bjfpjkrn.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/photoslibrary https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata',
        callback: ''
    });
});

$('.fbAuthenticateBtn').on('click', () => {
    $('.fbAuthenticateBtn').fadeOut("fast", () => {
        $('.loader').fadeIn("fast");
        signInWithPopup(auth, provider).then(async (result) => {
            CLIENT_NAME = emailToClientName[result.user.email];
            const storage = getStorage(app);
            const reference = ref(storage, 'credentials/gpAPICredentials.json');
            getDownloadURL(reference).then((url) => {
                $.getJSON(url).done((credentials) => {
                    CREDENTIALS = credentials;
                    gapi.load('client', initializeGapiClient);
                    $('.loader').fadeOut(() => {
                        $('.gpAuthenticateBtn').fadeIn();
                        $('.gpAuthenticateBtn').on('click', () => {
                            handleAuthClick();
                        });
                    });
                });
            }).catch((err) => {
                console.log(err);
            });
        }).catch((err) => {
            console.log(err);
        })
    });
});

const initializeGapiClient = async () => {
    await gapi.client.init({
        apiKey: CREDENTIALS.gpAPIKey,
        discoveryDocs: ['https://photoslibrary.googleapis.com/$discovery/rest?version=v1'],
    });
};

const handleAuthClick = () => {
    $('.gpAuthenticateBtn').fadeOut("fast", () => {
        $('.loader').fadeIn("fast");
    });
    
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        console.log(resp);
        await loadGraphs();
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({prompt: ''});
    }
};

const loadGraphs = () => {
    return gapi.client.photoslibrary.albums.list({}).then((albumsResponse) => {
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

                    const storage = getStorage(app);
                    const projectMapReference = ref(storage, `data/projectMap.json`);
                    getDownloadURL(projectMapReference)
                    .then((url) => {
                        $.getJSON(url, (projectMap) => {
                            console.log(projectMap);
                            const projectPath=projectMap[];
                            displayStats(CLIENT_NAME, storage);
        
                            drawTop3Stats(CLIENT_NAME, 'picturedWith', 'picturedWithTop3', columnOneColors, storage, projectPath);
                            drawTop3Stats(CLIENT_NAME, 'subjectTaker', 'asSubjectTop3', columnTwoColors, storage, projectPath);
                            drawTop3Stats(CLIENT_NAME, 'takerSubject', 'asPhototakerTop3', columnThreeColors, storage, projectPath);
                            drawBarGraph(CLIENT_NAME, 'photoTaker', storage, projectPath);
                            
                            $('#monthGraphPhotoTakerButton').on('click', () => {
                                drawBarGraph(CLIENT_NAME,'photoTaker', storage, projectPath);
                            });
                            
                            $('#monthGraphPhotoSubjectButton').on('click', () => {
                                drawBarGraph(CLIENT_NAME, 'subject', storage, projectPath);
                            });
        
                            drawDonut(CLIENT_NAME, storage, projectPath);
                            drawNetwork(CLIENT_NAME, 'picturedWith', clientPicturedWithSVG, 'clientPicturedWith', storage, projectPath);
                            drawNetwork(CLIENT_NAME, 'takerSubject', clientTakerSubjectSVG, 'clientTakerSubject', storage, projectPath);
                            drawNetwork('totalPW', 'picturedWith', totalPWSVG, 'totalPW', storage, projectPath);
                            drawNetwork('totalTS', 'takerSubject', totalTSSVG, 'totalTS', storage, projectPath);
                            
                            $('.authenticateSection').fadeOut('fast', () => {
                                $('.scroller').fadeIn("slow");
                            });
                        });
                    });
                    
                    // TODO
                    while ('nextPageToken' in mediaResponse) {
                        alert('todo');
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