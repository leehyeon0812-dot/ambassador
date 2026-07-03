import http.server
import socketserver
import os

# Pin to an absolute dir so we never call os.getcwd() in a restricted env.
os.chdir("/Users/arte/Desktop/am")

PORT = int(os.environ.get("PORT", "8123"))
Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
