import threading, time, queue


class AutomationWorker:
    def __init__(self):
        self._lock = threading.Lock()
        self.running = False
        self.mode = "auto"
        self.speed = 1.0
        self.setpoint = 50
        self._thread = None
        self._stop_event = threading.Event()
        self.log_queue = queue.Queue()
        self.status = {"running": False, "last_step": None, "setpoint": self.setpoint}

    def start(self):
        with self._lock:
            if self.running:
                self._log("Worker already running.")
                return False
            self.running = True
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._loop, daemon=True)
            self._thread.start()
            self._log("Worker started.")
            return True

    def stop(self):
        with self._lock:
            if not self.running:
                self._log("Worker not running.")
                return False
            self._stop_event.set()
            self.running = False
            self._log("Worker stopping...")
            return True

    def _loop(self):
        step = 0
        while not self._stop_event.is_set():
            step += 1
            value = self._simulate(step)
            self.status.update({
                "running": True,
                "last_step": step,
                "sim_value": value,
                "setpoint": self.setpoint,
            })
            self._log(f"Step {step}: sim_value={value:.2f}")
            time.sleep(max(0.05, self.speed))
        self.status["running"] = False
        self._log("Worker stopped.")
        self._stop_event.clear()

    def _simulate(self, step):
        return self.setpoint + (0.5 - (step % 10) / 10.0) * 2.0

    def update(self, mode=None, speed=None, setpoint=None):
        with self._lock:
            if mode: self.mode = mode
            if speed: self.speed = float(speed)
            if setpoint: self.setpoint = int(setpoint)
            self.status["setpoint"] = self.setpoint
            self._log(f"Params updated: mode={self.mode}, speed={self.speed}, setpoint={self.setpoint}")

    def manual_step(self):
        with self._lock:
            s = (self.status.get("last_step") or 0) + 1
            val = self._simulate(s)
            self.status.update({"last_step": s, "sim_value": val})
            self._log(f"Manual step {s}: {val:.2f}")
            return {"step": s, "value": val}

    def _log(self, text):
        from time import strftime
        ts = strftime("%Y-%m-%d %H:%M:%S")
        self.log_queue.put({"ts": ts, "text": text})

    def get_status(self):
        with self._lock:
            return dict(self.status)

    def pop_logs(self, n=50):
        out = []
        while not self.log_queue.empty() and len(out) < n:
            out.append(self.log_queue.get_nowait())
        return out

worker = AutomationWorker()
