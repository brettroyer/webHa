---

## 📂 Project Structure


```
webHa/
│
├── run.py
├── requirements.txt
│
├── app/
├──---- templates/
│       ├── index.html
│       └── login.html
├──---- static/
│       ├── js/main.js
│       └── css/style.css
├──---- blueprints/

│   ├── __init__.py        ← create_app() factory here
│   ├── auth.py            ← login/logout routes
│   ├── main.py            ← dashboard + API + SSE
│   ├── worker.py          ← background AutomationWorker class
│   └── models.py          ← user class + fake DB
│


```
