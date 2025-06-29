#!/usr/bin/env python3
"""
🤖 CryptoAI Bot Frontend Server

Simple HTTP server to serve the frontend with proper CORS headers.
"""

import http.server
import socketserver
import webbrowser
import threading
import time
import os
import sys

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with CORS support"""
    
    def end_headers(self):
        """Add CORS headers to all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight OPTIONS requests"""
        self.send_response(200)
        self.end_headers()

def start_server(port=8080):
    """Start the HTTP server"""
    handler = CORSHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"🤖 CryptoAI Bot Frontend Server")
            print(f"{'='*50}")
            print(f"📡 Server running on: http://localhost:{port}")
            print(f"🎯 Frontend URL: http://localhost:{port}/frontend/")
            print(f"🧪 Test Page: http://localhost:{port}/test_frontend.html")
            print(f"📚 Backend API: http://localhost:8000/docs")
            print(f"{'='*50}")
            print(f"🌟 Features:")
            print(f"   • Real-time trading dashboard")
            print(f"   • Complete trade history")
            print(f"   • AI decision timeline")
            print(f"   • Settings management")
            print(f"   • GSAP animations")
            print(f"   • Dark/Light themes")
            print(f"{'='*50}")
            print(f"🔧 Press Ctrl+C to stop the server")
            print()
            
            # Open browser after a short delay
            def open_browser():
                time.sleep(1)
                try:
                    webbrowser.open(f'http://localhost:{port}/frontend/')
                    print(f"🌐 Opened browser to frontend application")
                except:
                    print(f"💡 Manually open: http://localhost:{port}/frontend/")
            
            threading.Thread(target=open_browser, daemon=True).start()
            
            # Start serving
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {port} is already in use.")
            print(f"💡 Try a different port: python start_frontend.py --port 8081")
            print(f"💡 Or stop the existing service and try again.")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped by user")
        print(f"👋 Thanks for using CryptoAI Bot!")

def main():
    """Main function"""
    # Change to the directory containing this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Check if frontend directory exists
    if not os.path.exists('frontend'):
        print("❌ Frontend directory not found!")
        print("💡 Make sure you're running this from the app-for-crypto-bot directory")
        sys.exit(1)
    
    # Parse command line arguments
    port = 8080
    if len(sys.argv) > 1:
        if '--port' in sys.argv:
            try:
                port_idx = sys.argv.index('--port') + 1
                port = int(sys.argv[port_idx])
            except (IndexError, ValueError):
                print("❌ Invalid port number")
                sys.exit(1)
        elif '--help' in sys.argv or '-h' in sys.argv:
            print("🤖 CryptoAI Bot Frontend Server")
            print()
            print("Usage:")
            print("  python start_frontend.py [--port PORT]")
            print()
            print("Options:")
            print("  --port PORT    Port to serve on (default: 8080)")
            print("  --help, -h     Show this help message")
            print()
            print("Examples:")
            print("  python start_frontend.py")
            print("  python start_frontend.py --port 8081")
            return
    
    start_server(port)

if __name__ == "__main__":
    main() 