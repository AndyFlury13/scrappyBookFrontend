import { drawDonut } from "./donut.js";
import { 
    clientPicturedWithSVG, 
    clientTakerSubjectSVG, 
    drawNetwork,
    MAUI_NAMES,
    NAMES,
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
                            handleAuthClick(result.user.email);
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

const handleAuthClick = (email) => {
    $('.gpAuthenticateBtn').fadeOut("fast", () => {
        $('.loader').fadeIn("fast");
    });
    
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        console.log(resp);
        await loadGraphs(email);
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

const loadGraphs = (email) => {
    const storage = getStorage(app);
    const projectMapReference = ref(storage, `data/projectMap.json`);
    getDownloadURL(projectMapReference).then((url) => {
        $.getJSON(url, (projectMap) => {
            const projectPath=projectMap[email];
            const names = projectPath === 'maui' ? MAUI_NAMES : NAMES;
            const iconPromises = names.map((iconSubject) => new Promise((resolve, reject) => {
                const iconPhotoReference = ref(storage, `data/${projectPath}/iconPhotos/${iconSubject}.png`);
                getDownloadURL(iconPhotoReference).then((fbUrl) => {
                    resolve({
                        name: iconSubject,
                        url: fbUrl
                    });
                });
            }));
            Promise.all(iconPromises).then((iconData) => {
                drawNetwork(CLIENT_NAME, 'picturedWith', clientPicturedWithSVG, 'clientPicturedWith', storage, projectPath, iconData);
                drawNetwork(CLIENT_NAME, 'takerSubject', clientTakerSubjectSVG, 'clientTakerSubject', storage, projectPath, iconData);
                drawNetwork('totalPW', 'picturedWith', totalPWSVG, 'totalPW', storage, projectPath, iconData);
                drawNetwork('totalTS', 'takerSubject', totalTSSVG, 'totalTS', storage, projectPath, iconData);
            })
            


            displayStats(CLIENT_NAME, storage, projectPath);

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
            
            
            $('.authenticateSection').fadeOut('fast', () => {
                $('.scroller').fadeIn("slow");
            });
        });
    });
    $('.loader').fadeOut();
};