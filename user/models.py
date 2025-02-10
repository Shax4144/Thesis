from flask import jsonify, request, session, redirect
import uuid
from werkzeug.security import generate_password_hash
from database import db  

class User:

    @staticmethod
    def start_session(user):
        session['logged_in'] = True
        session['user'] = user
        return jsonify(user), 200
    
    @staticmethod
    def signup():
        user = {
            "_id": uuid.uuid4().hex,
            "firstname": request.form.get('firstname'),
            "middlename": request.form.get('middlename'),
            "lastname": request.form.get('lastname'),
            "birthdate": request.form.get('birthdate'),
            "age": request.form.get('age'),
            "belt": request.form.get('belt'),
            "gym": request.form.get('gym'),
            "username": request.form.get('username'),
            "password": generate_password_hash(request.form.get('password')),  # Hash password
        }

        if db.users.find_one({ "username": user['username'] }):
            return jsonify({"error": "Username is already taken"}), 400
        if db.users.insert_one(user):
            return User.start_session(user)

        return jsonify({ "error": "Signup failed"}), 400
    
    @staticmethod
    def signout():
        session.clear()  # Clears session
        return redirect('/')  # Redirects to login page
