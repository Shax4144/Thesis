function loadGDriveAPI() {
    gapi.load('client', initClient);
}

function initClient() {
    gapi.client.init({
        clientId: 'YOUR_CLIENT_ID',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file',
    }).then(() => {
        console.log('Google Drive API Initialized');
    }).catch(error => {
        console.error('Error initializing Drive API:', error);
    });
}

// Use Google Identity Services to sign in
function signIn() {
    google.accounts.oauth2.initTokenClient({
        client_id: 'YOUR_CLIENT_ID',
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
            if (response.access_token) {
                console.log("Authenticated successfully!");
                listFiles(response.access_token);
            } else {
                console.error("Authentication failed");
            }
        }
    }).requestAccessToken();
}

// Get authentication token
function getAuthToken() {
    return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
}

// Fetch files from "records" folder
function listFiles() {
    const folderName = "Records";

    // Search for the folder ID
    gapi.client.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        fields: "files(id)"
    }).then(response => {
        if (response.result.files.length > 0) {
            const folderId = response.result.files[0].id;
            getFolderContents(folderId);
        } else {
            console.log("Folder not found");
        }
    });
}

// Get files inside the folder
function getFolderContents(folderId) {
    gapi.client.drive.files.list({
        q: `'${folderId}' in parents`,
        fields: "files(id, name, webViewLink, mimeType)"
    }).then(response => {
        displayFiles(response.result.files);
    });
}

// Display files in the HTML
function displayFiles(files) {
    const recordBox = document.querySelector('.record-box');
    recordBox.innerHTML = "";

    if (files.length === 0) {
        recordBox.innerHTML = "<p>No records found.</p>";
        return;
    }

    files.forEach(file => {
        const fileElement = document.createElement("div");
        fileElement.classList.add("file-item");

        fileElement.innerHTML = `
            <p>${file.name}</p>
            <a href="${file.webViewLink}" target="_blank">View</a>
        `;

        recordBox.appendChild(fileElement);
    });
}
