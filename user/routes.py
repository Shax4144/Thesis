from flask import Blueprint
from user.models import User  

user_bp = Blueprint('user', __name__)  # Create a Blueprint

@user_bp.route('/user/signup', methods=['POST'])
def signup():
    return User.signup()  # Call static method

@user_bp.route('/signout')
def signout():
    return User.signout()  # Call static method
