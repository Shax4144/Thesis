import socket
import threading
from flask import Flask, request, render_template, session, redirect, jsonify, make_response
from functools import wraps
from flask_socketio import SocketIO
from user.routes import user_bp  
from database import db
from googleapiclient.discovery import build
from google.oauth2 import service_account
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
import io
from datetime import datetime

app = Flask(__name__)
app.secret_key = "your-secure-secret-key"
app.register_blueprint(user_bp, url_prefix='/api')
socketio = SocketIO(app, cors_allowed_origins="*")

SERVER_IP = "raspberrypi"  # Change this to match your setup
PORT = 5000

# Google Drive API Setup
SCOPES = ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive.readonly"]
SERVICE_ACCOUNT_FILE = r"Thesis\eternal-tempest-451603-c6-a701efdfca67.json"
ROOT_FOLDER_ID = "1NndBdfWTZl4ZMjGZWWb1UjgeVijl986v"
ARCHIVE_FOLDER_ID = "1GM5-ZA57QPylEhcMexwhhVmdd2g09ZRX"

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
service = build("drive", "v3", credentials=creds)

def receive_rfid_data():
    """Function to receive RFID data from the server and send it to the frontend."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client_socket:
            client_socket.connect((SERVER_IP, PORT))
            print("[CONNECTED] Receiving RFID data...")

            while True:
                data = client_socket.recv(1024).decode().strip()
                if data:
                    print(f"[RFID] {data}")
                    # Emit the actual RFID data to update the input box
                    socketio.emit("rfid_data", {"rfid": data})

    except Exception as e:
        print(f"[ERROR] Could not connect: {e}")


def create_drive_folder(folder_name, parent_folder_id):
    """Creates a new folder in Google Drive inside the specified parent folder."""
    try:
        file_metadata = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [parent_folder_id]
        }
        folder = service.files().create(body=file_metadata, fields="id").execute()
        return folder.get("id")
    except Exception as e:
        print(f"❌ Error creating folder: {e}")
        return None


def move_drive_folder(folder_id, new_parent_id):
    """Moves an entire folder (including its contents) to a new parent folder in Google Drive."""
    try:
        file_info = service.files().get(fileId=folder_id, fields="parents").execute()
        old_parents = ",".join(file_info.get("parents", []))

        service.files().update(
            fileId=folder_id,
            addParents=new_parent_id,
            removeParents=old_parents,
            fields="id, parents"
        ).execute()

        print(f"✅ Successfully moved folder {folder_id} to {new_parent_id}")

    except Exception as e:
        print(f"❌ Error moving folder {folder_id}: {e}")


def generate_pdf(players):
    """Generate a well-formatted PDF report of all players with a table."""
    buffer = io.BytesIO()
    today_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Create PDF Document
    pdf = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    # Title Section
    styles = getSampleStyleSheet()
    title = Paragraph(f"<b>Player Archive Report</b><br/><br/>Date: {today_date}", styles["Title"])
    elements.append(title)

    # Table Headers
    table_data = [["First Name", "Middle Name", "Last Name", "Category", "Age", "Belt", "Gym", "Weight (kg)"]]

    # Add Player Data to the Table
    for player in players:
        table_data.append([
            player["firstname"],
            player.get("middlename", "-"),
            player["lastname"],
            player["category"],
            player["age"],
            player["belt"],
            player["gym"],
            player["weight"]
        ])

    # Create Table
    table = Table(table_data, colWidths=[80, 80, 80, 80, 50, 60, 100, 70])

    # Add Styling to Table
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
    ]))

    elements.append(table)

    # Build the PDF
    pdf.build(elements)
    buffer.seek(0)
    return buffer

def upload_to_drive(file_stream, filename, parent_folder_id):
    """Upload the PDF file to Google Drive."""
    from googleapiclient.http import MediaIoBaseUpload

    file_metadata = {
        "name": filename,
        "parents": [parent_folder_id]
    }
    media = MediaIoBaseUpload(file_stream, mimetype="application/pdf")

    uploaded_file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id, webViewLink"
    ).execute()

    return uploaded_file.get("id"), uploaded_file.get("webViewLink")


@app.route("/api/archiveRecords", methods=["POST"])
def archive_records():
    """Archive player records, generate a PDF, and move data to Google Drive."""
    from datetime import datetime
    today_date = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    records_folder_name = f"Records_{today_date}"

    try:
        # Step 1: Create archive folder in Google Drive
        records_archive_folder_id = create_drive_folder(records_folder_name, ARCHIVE_FOLDER_ID)

        # Step 2: Fetch all player records from the database
        players = list(db.players.find({}, {'_id': 0}))
        if not players:
            return jsonify({"message": "No player records found to archive."}), 400

        # Step 3: Generate PDF from player data
        pdf_buffer = generate_pdf(players)

        # Step 4: Upload PDF to the archive folder
        pdf_filename = f"Players_Archive_{today_date}.pdf"
        pdf_id, pdf_link = upload_to_drive(pdf_buffer, pdf_filename, records_archive_folder_id)

        # Step 5: Move all player folders inside the new archive folder
        query = f"'{ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=query, fields="files(id, name)").execute()
        folders = results.get("files", [])

        for folder in folders:
            folder_id = folder["id"]
            move_drive_folder(folder_id, records_archive_folder_id)

        # Step 6: Clear player records from the database
        db.players.delete_many({})

        return jsonify({
            "message": f"All player records moved to {records_folder_name}!",
            "pdf_link": pdf_link
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
            print(f" No files found in folder: {folder_id}")  # Debugging
        else:
            print(f" Found {len(files)} files in folder: {folder_id}")  # Debugging

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
    threading.Thread(target=receive_rfid_data, daemon=True).start()  # Start RFID receiving in a separate thread
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
