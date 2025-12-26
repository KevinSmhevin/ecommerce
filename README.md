# Pokebin E-commerce Platform

A modern e-commerce platform with Django REST API backend and React frontend.

## Project Structure

```
ecommerce/
├── backend/          # Django REST API
├── frontend/         # React + Vite application
└── venv/            # Python virtual environment
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

5. Seed sample products (optional):
```bash
python manage.py seed_products
```

6. Start the Django development server:
```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/api/`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The React app will be available at `http://localhost:5173`

## API Endpoints

- `GET /api/categories/` - List all categories
- `GET /api/categories/{id}/` - Get category details
- `GET /api/products/` - List all products (supports ?category=slug&ordering=price)
- `GET /api/products/{id}/` - Get product details

## Tech Stack

### Backend
- Django 5.1.3
- Django REST Framework
- PostgreSQL (production) / SQLite (development)

### Frontend
- React 18
- Vite
- React Router
- Tailwind CSS
- Axios

## Design System

The application uses a minimalist design with:
- **Primary Colors**: Red (#DC2626), Black (#000000), White (#FFFFFF)
- **Typography**: Clean, modern sans-serif fonts
- **Components**: Minimal borders, subtle shadows, clean spacing


