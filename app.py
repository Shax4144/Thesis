from flask import Flask, render_template, session, redirect, jsonify
from functools import wraps
from user.routes import user_bp  
from database import db

app = Flask(__name__)
app.secret_key = "your_secret_key_here"  # Secure secret key
app.register_blueprint(user_bp, url_prefix='/api')  # Register Blueprint

# Decorator to enforce login before accessing pages
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
    return render_template('homepage.html')

@app.route('/login')
def log():
    return render_template('log.html')

@app.route('/registration')
def reg():
    return render_template('reg.html')

@app.route('/admin')
@login_required 
def admin():
    return render_template('admin.html')


@app.route('/api/players', methods=['GET'])
def get_players():
    players = list(db.players.find({}, {'_id': 0}))  # Fetch all players, excluding _id
    return jsonify(players)


if __name__ == '__main__':
    app.run(debug=True)
