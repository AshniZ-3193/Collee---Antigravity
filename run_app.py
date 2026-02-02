
import subprocess
import os
import sys
import time

def main():
    print("Starting Collee MVP...")
    
    # Check if virtual environment is active or dependencies installed?
    # We assume 'python' is the correct interpreter with dependencies.
    
    # 1. Start Backend (Uvicorn)
    print("Starting Backend (FasAPI)...")
    # Using sys.executable ensures we use the same python interpreter (env)
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
        cwd=os.path.abspath(os.curdir)
    )
    
    # Give backend a moment
    time.sleep(2)
    
    # 2. Start Frontend (Vite)
    print("Starting Frontend (Vite)...")
    frontend_dir = os.path.join(os.path.abspath(os.curdir), "frontend")
    
    # On Windows npm is a batch file usually
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )
    
    print("\n---------------------------------------------------------")
    print("Collee App Running!")
    print("Backend: http://localhost:8000")
    print("Frontend: Check Vite output above (usually http://localhost:8080)")
    print("Press Ctrl+C to stop.")
    print("---------------------------------------------------------\n")

    try:
        while True:
            time.sleep(1)
            # Check if processes are alive
            if backend_process.poll() is not None:
                print("Backend process ended unexpectedly.")
                break
            if frontend_process.poll() is not None:
                print("Frontend process ended unexpectedly.")
                break
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_process.terminate()
        # On Windows, terminating the shell wrapper might not kill the child
        if sys.platform == 'win32':
             subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_process.pid)])
        else:
             frontend_process.terminate()
        print("Done.")

if __name__ == "__main__":
    main()
