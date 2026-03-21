import sys, threading, traceback, time, os

def dump():
    time.sleep(2)
    print("DUMPING TRACEBACK")
    for tid, f in sys._current_frames().items():
        print(f"\n--- Thread {tid} ---")
        traceback.print_stack(f)
    os._exit(1)

threading.Thread(target=dump, daemon=True).start()

print("Importing app.db.topics...")
import app.db.topics
print("SUCCESS")
