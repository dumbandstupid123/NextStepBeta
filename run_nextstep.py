#!/usr/bin/env python3

import os
import sys

def main():
    print("🏥 Starting NextStep Healthcare Navigator...")
    
    if not os.path.exists("backend"):
        print("❌ Backend directory not found!")
        print("📁 Please run this script from the NextStep project root")
        sys.exit(1)
    
    os.environ['PYTHONPATH'] = os.getcwd()
    
    os.chdir("backend")
    
    print("📍 Server starting on http://localhost:8000")
    print("🛑 Press Ctrl+C to stop")
    print("--------------------------------------------------")
    
    try:
        import uvicorn
        uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
    except KeyboardInterrupt:
        print("\n🛑 NextStep Healthcare Navigator stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main() 