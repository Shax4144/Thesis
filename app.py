from flask import Flask, request, send_from_directory, render_template, session, redirect, jsonify, make_response
from functools import wraps
from user.routes import user_bp  
from database import db
from googleapiclient.discovery import build
from google.oauth2 import service_account
import os

app = Flask(__name__)
app.secret_key = "your-secure-secret-key"
app.register_blueprint(user_bp, url_prefix='/api')

# Google Drive API Setup
SCOPES = ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive.readonly"]
SERVICE_ACCOUNT_FILE = r"C:\Users\chest\thesis\Thesis\eternal-tempest-451603-c6-dba865b61b34.json"
ROOT_FOLDER_ID = "1NndBdfWTZl4ZMjGZWWb1UjgeVijl986v"
ARCHIVE_FOLDER_ID = "1GM5-ZA57QPylEhcMexwhhVmdd2g09ZRX"

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
service = build("drive", "v3", credentials=creds)


def create_drive_folder(folder_name, parent_folder_id):
    """Creates a new folder in Google Drive inside the specified parent folder."""
    try:
        file_metadata = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [parent_folder_id]
        }
        folder = service.files().create(body=file_metadata, fields="id").execute()
        return folder.get("id")  # Returns the new folder's ID
    except Exception as e:
        print(f"❌ Error creating folder: {e}")
        return None


def move_drive_folder(folder_id, new_parent_id):
    """Moves a Google Drive folder to a new parent folder (archive)."""
    try:
        # Get the current parent of the folder
        file_info = service.files().get(fileId=folder_id, fields="parents").execute()
        old_parents = ",".join(file_info.get("parents", []))

        # Move folder by adding a new parent and removing the old one
        service.files().update(
            fileId=folder_id,
            addParents=new_parent_id,
            removeParents=old_parents,
            fields="id, parents"
        ).execute()
        print(f"✅ Moved folder {folder_id} to Archive")
    except Exception as e:
        print(f"❌ Error moving folder {folder_id}: {e}")


# Archive Player Records
@app.route("/api/archiveRecords", methods=["POST"])
def archive_records():
    """Move all record content folders to an archive subfolder named Records_YYYY-MM-DD."""
    from datetime import datetime
    today_date = datetime.now().strftime("%Y-%m-%d")
    records_folder_name = f"Records_{today_date}"

    try:
        # Step 1: Create a new folder inside Archive named "Records_YYYY-MM-DD"
        records_archive_folder_id = create_drive_folder(records_folder_name, ARCHIVE_FOLDER_ID)
        if not records_archive_folder_id:
            return jsonify({"error": "Failed to create archive folder"}), 500

        # Step 2: Fetch all record content folders
        query = f"'{ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=query, fields="files(id, name)").execute()
        folders = results.get("files", [])

        if not folders:
            return jsonify({"message": "No record folders found to archive."})

        # Step 3: Move each folder to the newly created "Records_YYYY-MM-DD" archive folder
        for folder in folders:
            folder_id = folder["id"]
            move_drive_folder(folder_id, records_archive_folder_id)

        return jsonify({"message": f"All record content moved to {records_folder_name}!"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# File Archive Setup
@app.route("/api/Archive", methods=["POST"])
def archive_file():
    from googleapiclient.http import MediaIoBaseUpload
    import io

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    parent_folder_id = ARCHIVE_FOLDER_ID  # Google Drive archive folder ID

    from datetime import datetime
    today_date = datetime.now().strftime("%Y-%m-%d")
    file_name = f"Players_{today_date}.pdf"

    try:
        # Convert file to byte stream
        file_stream = io.BytesIO(file.read())

        # Upload to Google Drive
        file_metadata = {"name": file_name, "parents": [parent_folder_id]}
        media = MediaIoBaseUpload(file_stream, mimetype="application/pdf")

        uploaded_file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields="id, webViewLink"
        ).execute()

        return jsonify({
            "message": "File archived successfully",
            "file_id": uploaded_file.get("id"),
            "file_link": uploaded_file.get("webViewLink")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/players/clear", methods=["DELETE"])
def clear_players():
    """Remove all players after archiving."""
    try:
        db.players.delete_many({})
        return jsonify({"message": "All players have been removed after archiving."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_files(folder_id=ROOT_FOLDER_ID):
    """Fetch files from Google Drive folder."""
    try:
        query = f"'{folder_id}' in parents and trashed = false"
        results = service.files().list(q=query, fields="files(id, name, mimeType, webViewLink)").execute()
        files = results.get("files", [])

        if not files:
            print(f"📂 No files found in folder: {folder_id}")  # Debugging
        else:
            print(f"📂 Found {len(files)} files in folder: {folder_id}")  # Debugging

        return files
    except Exception as e:
        print(f"❌ Error retrieving files: {e}")  # Debugging
        return []


# Authentication Middleware
def login_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return f(*args, **kwargs)
        else:
            return redirect('/')
    return wrap


# Routes
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login')
def log():
    return render_template('log.html')

@app.route('/registration')
def reg():
    return render_template('reg.html')

@app.route('/api/admin')
@login_required
def admin():
    files = get_files()
    response = make_response(render_template('admin.html', files=files))
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return response


@app.route('/api/dashboard_data')
def dashboard_data():
    """Returns player count for the dashboard."""
    try:
        players_count = db.players.count_documents({})
        return jsonify({'players': players_count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/audienceSB')
def audienceSB():
    return render_template('audienceSB.html')

@app.route('/api/adminSB')
def adminSB():
    return render_template('adminSB.html')


@app.route('/api/players')
def get_players():
    """Fetch all registered players."""
    try:
        players = list(db.players.find({}, {'_id': 0}))
        return jsonify(players)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/folder/<folder_id>")
def folder_contents(folder_id):
    """Fetch files from a Google Drive folder."""
    try:
        files = get_files(folder_id)
        if not files:
            return jsonify({"message": "No files found", "files": []}), 200
        return jsonify(files)
    except Exception as e:
        print(f"❌ Error fetching files: {e}")  # Debugging output
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
