from flask import Flask, render_template, session, redirect, jsonify, make_response
from functools import wraps
from user.routes import user_bp  
from database import db
from googleapiclient.discovery import build
from google.oauth2 import service_account

app = Flask(__name__)
app.secret_key = "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"  # Secure secret key
app.register_blueprint(user_bp, url_prefix='/api')  # Register Blueprint

# Google Drive API Setup
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
SERVICE_ACCOUNT_FILE = r"C:\Users\Syree\THESIS FRONTEND\v3\Thesis\eternal-tempest-451603-c6-ebb595a1e8be.json"
ROOT_FOLDER_ID = "1NndBdfWTZl4ZMjGZWWb1UjgeVijl986v"  # Your root folder ID
creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
service = build("drive", "v3", credentials=creds)


def get_files(folder_id=ROOT_FOLDER_ID):
    """Fetch files from a given Google Drive folder."""
    query = f"'{folder_id}' in parents and trashed = false"
    fields = "files(id, name, mimeType, webViewLink)"  # Ensure webViewLink igit s included

    results = service.files().list(q=query, fields=fields).execute()
    return results.get("files", [])


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
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.route('/api/audienceSB')
def audienceSB():
    return render_template('audienceSB.html')  # Call static method

@app.route('/api/adminSB')
def adminSB():
    return render_template('adminSB.html')  # Call static method

@app.route('/api/players')
def get_players():
    players = list(db.players.find({}, {'_id': 0}))  # Fetch all players, excluding _id
    return jsonify(players)

@app.route("/folder/<folder_id>")
def folder_contents(folder_id):
    files = get_files(folder_id)
    return jsonify(files)

if __name__ == '__main__':
    app.run(debug=True)  # Set to False for production

