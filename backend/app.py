from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/data')
def get_data():
    return jsonify({"message": "Salut depuis le serveur Python !"})

# Nouvelle route pour recevoir un prénom
@app.route('/api/hello', methods=['POST'])
def say_hello():
    data = request.json
    name = data.get('name', 'Inconnu')
    return jsonify({"message": f"Bravo {name}, ton formulaire fonctionne !"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)