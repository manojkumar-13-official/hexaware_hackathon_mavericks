"""
Lightweight Sentence Transformers embedding microservice.
Model: all-MiniLM-L6-v2 (384-dim, fast, free, no API key needed)
Usage: python embed_server.py
Endpoint: POST /embed { "text": "..." } -> { "embedding": [...] }
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from sentence_transformers import SentenceTransformer

import os

PORT = 5001

# Point directly to the fully-cached local snapshot — no network calls needed
CACHE_DIR = os.path.expanduser(
    r"~\.cache\huggingface\hub\models--sentence-transformers--all-MiniLM-L6-v2"
    r"\snapshots\fa97f6e7cb1a59073dff9e6b13e2715cf7475ac9"
)

print(f"Loading model from local cache:\n  {CACHE_DIR}")
try:
    model = SentenceTransformer(CACHE_DIR)
    print(f"Model loaded successfully. Listening on http://localhost:{PORT}")
except Exception as e:
    print(f"ERROR loading model: {e}")
    raise


class EmbedHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/embed":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            payload = json.loads(body)
            text = payload.get("text", "")
            if not text:
                raise ValueError("Missing 'text' field in request body")

            embedding = model.encode(text).tolist()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"embedding": embedding}).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        print(f"[embed_server] {self.address_string()} - {format % args}")


if __name__ == "__main__":
    server = HTTPServer(("localhost", PORT), EmbedHandler)
    server.serve_forever()
