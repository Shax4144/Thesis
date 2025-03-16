from googleapiclient.discovery import build
from google.oauth2 import service_account
from flask import jsonify, request
import uuid
from database import db  

# Google Drive API Setup
SCOPES = ["https://www.googleapis.com/auth/drive"]
SERVICE_ACCOUNT_FILE = r"C:\Users\chest\thesis\Thesis\eternal-tempest-451603-c6-dba865b61b34.json"
ROOT_FOLDER_ID = "1NndBdfWTZl4ZMjGZWWb1UjgeVijl986v"  # Your root Google Drive folder
ARCHIVE_FOLDER_ID = "1GM5-ZA57QPylEhcMexwhhVmdd2g09ZRX"  # Your Google Drive archive folder

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
service = build("drive", "v3", credentials=creds)

def create_drive_folder(folder_name, parent_folder_id=ROOT_FOLDER_ID):
    """Create a new folder in Google Drive."""
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
    """Moves a Google Drive folder to a new parent folder (archive)."""
    try:
        service.files().update(
            fileId=folder_id,
            addParents=new_parent_id,
            removeParents=ROOT_FOLDER_ID,
            fields="id, parents"
        ).execute()
        print(f"✅ Moved folder {folder_id} to Archive")
    except Exception as e:
        print(f"❌ Error moving folder {folder_id}: {e}")

class Players:
    @staticmethod
    @staticmethod
    def signup():
        try:
            # Get form data
            players = {
                "_id": uuid.uuid4().hex,
                "firstname": request.json.get("firstname", "").strip(),  
                "middlename": request.json.get("middlename", "").strip(),
                "lastname": request.json.get("lastname", "").strip(),
                "category": request.json.get("category", "").strip(),
                "age": request.json.get("age", "").strip(),
                "belt": request.json.get("belt", "").strip(),
                "gym": request.json.get("gym", "").strip(),
                "weight": request.json.get("weight", "").strip(),
                "weight_category": request.json.get("weight_category", "").strip(),
            }

            # ✅ Debugging: Print received data
            print(f"Received Player Data: {players}")

            # Validate required fields
            missing_fields = [key for key, value in players.items() if not value]
            if missing_fields:
                return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

            # Insert into the database
            result = db.players.insert_one(players)
            if result.acknowledged:
                return jsonify({"message": "Signup successful"}), 200
            
            return jsonify({"error": "Signup failed"}), 500

        except Exception as e:
            import traceback
            print("❌ ERROR in signup:", traceback.format_exc())  # Print full error
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def archive_players():
        """Archive players and move their folders to the archive folder."""
        try:
            players = list(db.players.find({}))  # Fetch all players
            
            if not players:
                return jsonify({"error": "No players to archive"}), 400

            for player in players:
                folder_id = player.get("folder_id")
                if folder_id:
                    move_drive_folder(folder_id, ARCHIVE_FOLDER_ID)  # Move folder to archive

            # Remove players from active database after archiving
            db.players.delete_many({})
            return jsonify({"message": "Players archived successfully!"}), 200
        except Exception as e:
            print(f"❌ Error archiving players: {e}")
            return jsonify({"error": str(e)}), 500
