# EduPath2

A comprehensive educational platform for Kenyan students to discover courses, universities, and career paths.

## Features

- **Information Directory**: Browse courses and universities with advanced filtering
- **Career Hubs**: Community-driven discussions and knowledge sharing
- **Cluster Points Calculator**: Calculate university admission eligibility
- **Academic Profile**: Track academic progress and achievements
- **Bookmarking System**: Save interesting courses and universities

## Tech Stack

### Backend
- Django REST Framework
- PostgreSQL (recommended) / SQLite (development)
- Python 3.8+

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Router
- React Query

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create superuser:
```bash
python manage.py createsuperuser
```

6. Populate sample data:
```bash
python manage.py populate_hubs
python manage.py populate_real_universities
python manage.py populate_course_clusters
```

7. Start development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd edupath-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## API Endpoints

- **Courses**: `/api/courses/`
- **Universities**: `/api/universities/`
- **Hubs**: `/api/hubs/`
- **Authentication**: `/api/auth/`
- **Cluster Calculation**: `/api/courses/calculate-cluster/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
