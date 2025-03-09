from flask import Flask, render_template, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health')
def health_check():
    """Simple endpoint to verify the app is running correctly"""
    return jsonify({"status": "ok", "message": "Server is running"})

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)  # Explicitly set host and port 