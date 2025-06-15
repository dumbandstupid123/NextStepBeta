#!/usr/bin/env python3

import os
import sys
import ssl
import subprocess
from pathlib import Path

def create_self_signed_cert():
    cert_file = "nextstep_cert.pem"
    key_file = "nextstep_key.pem"
    
    if not os.path.exists(cert_file) or not os.path.exists(key_file):
        print("🔐 Creating self-signed certificate for HTTPS...")
        try:
            subprocess.run([
                "openssl", "req", "-x509", "-newkey", "rsa:4096", 
                "-keyout", key_file, "-out", cert_file, "-days", "365", "-nodes",
                "-subj", "/C=US/ST=TX/L=Houston/O=NextStep/CN=localhost"
            ], check=True, capture_output=True)
            print("✅ Certificate created successfully!")
            return cert_file, key_file
        except subprocess.CalledProcessError as e:
            print("❌ Failed to create certificate. OpenSSL may not be installed.")
            print("📝 You can install OpenSSL with: brew install openssl")
            return None, None
        except FileNotFoundError:
            print("❌ OpenSSL not found. Please install OpenSSL:")
            print("📝 On macOS: brew install openssl")
            print("📝 On Ubuntu: sudo apt-get install openssl")
            return None, None
    else:
        print("🔐 Using existing certificate files")
        return cert_file, key_file

def main():
    print("🏥 Starting NextStep Healthcare Navigator (HTTPS)...")
    
    if not os.path.exists("backend"):
        print("❌ Backend directory not found!")
        print("📁 Please run this script from the NextStep project root")
        sys.exit(1)
    
    cert_file, key_file = create_self_signed_cert()
    
    if not cert_file or not key_file:
        print("⚠️  Could not create HTTPS certificate. Falling back to HTTP...")
        print("🔧 Running without HTTPS - microphone may not work in some browsers")
        os.system("python3 run_nextstep.py")
        return
    
    current_dir = os.getcwd()
    backend_dir = os.path.join(current_dir, "backend")
    
    if 'PYTHONPATH' in os.environ:
        os.environ['PYTHONPATH'] = f"{current_dir}:{backend_dir}:{os.environ['PYTHONPATH']}"
    else:
        os.environ['PYTHONPATH'] = f"{current_dir}:{backend_dir}"
    
    print("📍 Server starting on https://localhost:8000")
    print("🔐 Using self-signed certificate (you'll see a security warning)")
    print("🛑 Press Ctrl+C to stop")
    print("--------------------------------------------------")
    
    try:
        import uvicorn
        uvicorn.run(
            "backend.app:app",
            host="0.0.0.0",
            port=8000,
            ssl_keyfile=key_file,
            ssl_certfile=cert_file,
            reload=False
        )
    except KeyboardInterrupt:
        print("\n🛑 NextStep Healthcare Navigator stopped")
    except Exception as e:
        print(f"❌ Error starting HTTPS server: {e}")
        print("📝 Falling back to HTTP version...")
        os.system("python3 run_nextstep.py")

if __name__ == "__main__":
    main() 