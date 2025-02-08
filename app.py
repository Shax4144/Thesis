from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('homepage.html')

@app.route('/register')  # Changed the route from '/' to '/register'
def reg():
    return render_template('registration.html')

@app.route('/login')  # Changed the route from '/' to '/register'
def login():
    return render_template('login.html')

if __name__ == '__main__':
    app.run(debug=True)
