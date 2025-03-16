from googleapiclient.discovery import build
from google.oauth2 import service_account
from flask import jsonify, request
import uuid
from database import db  

# Google Drive API Setup
SCOPES = ["https://www.googleapis.com/auth/drive"]
SERVICE_ACCOUNT_FILE = "C:/Users/chest/thesis/Thesis/eternal-tempest-451603-c6-ca1051611364.json"
ROOT_FOLDER_ID = "1NndBdfWTZl4ZMjGZWWb1UjgeVijl986v"  # Your root Google Drive folder

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
service = build("drive", "v3", credentials=creds)

def create_drive_folder(folder_name, parent_folder_id=ROOT_FOLDER_ID):
    """Create a new folder in Google Drive."""
    file_metadata = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [parent_folder_id]
    }
    
    folder = service.files().create(body=file_metadata, fields="id").execute()
    return folder.get("id")

class Players:
    @staticmethod
    def signup():
        # Get form data
        players = {
            "_id": uuid.uuid4().hex,
            "firstname": request.json.get('firstname'),  
            "middlename": request.json.get('middlename'),
            "lastname": request.json.get('lastname'),
            "category": request.json.get('category'),
            "age": request.json.get('age'),
            "belt": request.json.get('belt'),
            "gym": request.json.get('gym'),
            "weight": request.json.get('weight'),
            "weight_category": request.json.get('weight_category'),
        }

        # Validate required fields
        missing_fields = [key for key, value in players.items() if value in [None, "", "select"]]
        if missing_fields:
            return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

        # Generate full name for folder
        full_name = f"{players['firstname']} {players['middlename']} {players['lastname']}"

        # Create Google Drive folder with player's full name
        folder_id = create_drive_folder(full_name)

        # Store folder ID in the database
        players["folder_id"] = folder_id

        # Insert into the database
        result = db.players.insert_one(players)  
        if result.acknowledged:
            return jsonify({"message": "Signup successful", "folder_id": folder_id}), 200
        
        return jsonify({"error": "Signup failed"}), 400

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
            return jsonify({"error": str(e)}), 500