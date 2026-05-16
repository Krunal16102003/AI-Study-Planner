# AI Study Planner

Full-stack AI-powered study planner for students using Django REST Framework and React.

## Features

- JWT registration/login
- Subject, exam date, difficulty, confidence, and priority tracking
- Weak-topic management with optional resource links
- Smart timetable generation using exam urgency, weakness, priority, and spaced revision
- Progress logs, completion percentages, streaks, and readiness score
- Quiz question storage and lightweight quiz generation
- Pomodoro session tracking
- In-app notifications and analytics

## Run Locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend defaults to `http://localhost:5173` and backend to `http://127.0.0.1:8000`.
