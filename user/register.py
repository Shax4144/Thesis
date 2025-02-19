from flask import jsonify, request
import uuid
from database import db  # Ensure database connection is imported

class Players:

    @staticmethod
    def signup():
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
            #"rfid": request.json.get('rfid'),
        }

        # Validate required fields
        missing_fields = [key for key, value in players.items() if value in [None, "", "select"]]
        if missing_fields:
            return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

        # Insert into the database
        result = db.players.insert_one(players)  
        if result.acknowledged:
            return jsonify({"message": "Signup successful"}), 200
        
        return jsonify({"error": "Signup failed"}), 400
