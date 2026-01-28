# Barbershop Management System

A full-stack mobile application for managing barbershop operations, including service bookings, product sales, and appointment scheduling. Built with React Native (Expo) and Django REST Framework.

## 🏗️ Architecture

- **Frontend**: React Native with Expo
- **Backend**: Django REST Framework with PostgreSQL
- **Authentication**: JWT tokens
- **Image Storage**: Cloudinary
- **Payment Gateway**: Chapa (Ethiopian payment gateway)

## 📋 Prerequisites

### Docker Setup (Recommended)
- Docker Desktop (or Docker Engine + Docker Compose)
- Git

### Manual Setup (Alternative)
- Python 3.10+
- Node.js 16+
- PostgreSQL 12+
- Redis (optional, for caching - falls back to memory cache if unavailable)
- Expo CLI (`npm install -g expo-cli`)
- Git

## 🚀 Quick Start

### 🐳 Docker Setup (Recommended)

The easiest way to run the entire stack is using Docker Compose. This method requires **no local installation** of Python, Node.js, PostgreSQL, or Redis.

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd BSBS_UPDATED
   ```

2. **Set up environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual values (Cloudinary, Chapa, Firebase, etc.)
   # Note: DB_HOST and REDIS_URL are automatically set for Docker
   cd ..
   ```

3. **Start all services:**
   ```bash
   docker compose up --build
   ```
   
   This will start:
   - PostgreSQL database (port 5432)
   - Redis cache (port 6379)
   - Django backend (port 8000)
   - React/Expo client (ports 19000-19002) - optional, use `--profile client` to include

4. **Run database migrations:**
   ```bash
   docker compose exec backend python manage.py migrate
   ```

5. **Create superuser (optional):**
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

6. **Access the services:**
   - Backend API: http://localhost:8000
   - API Documentation (Swagger): http://localhost:8000/api/docs/
   - Django Admin: http://localhost:8000/admin/
   - ReDoc Documentation: http://localhost:8000/api/redoc/

#### Common Docker Commands

```bash
# Start services in background
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f redis

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v

# Rebuild after code changes
docker compose up --build

# Run Django management commands
docker compose exec backend python manage.py <command>
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser

# Run tests
docker compose exec backend pytest

# Access Django shell
docker compose exec backend python manage.py shell

# Access PostgreSQL shell
docker compose exec db psql -U postgres -d barbershop_db

# Access Redis CLI
docker compose exec redis redis-cli
```

#### Running Client with Docker (Optional)

The React/Expo client can also run in Docker, but for mobile development, you'll typically run it locally:

```bash
# Start client in Docker (for web development)
docker compose --profile client up client

# Or start everything including client
docker compose --profile client up
```

**Note:** For mobile app development, it's recommended to run the client locally using Expo CLI, as Docker doesn't support mobile device connections directly.

#### Environment Variables in Docker

The Docker setup automatically configures:
- `DB_HOST=db` (Docker service name)
- `REDIS_URL=redis://redis:6379/1` (Docker service name)

Your existing `.env` file will work without changes. The Docker Compose file overrides only these two variables for internal networking.

#### Troubleshooting Docker Setup

1. **Port already in use:**
   - Change ports in `docker-compose.yml` if 8000, 5432, or 6379 are taken
   - Or stop the conflicting service

2. **Database connection errors:**
   - Wait a few seconds after `docker compose up` for PostgreSQL to initialize
   - Check logs: `docker compose logs db`

3. **Permission errors (Linux/Mac):**
   - Ensure Docker has proper permissions
   - Try: `sudo docker compose up`

4. **Windows line endings in entrypoint.sh:**
   - If you see `/bin/sh^M: bad interpreter`, convert line endings:
   - Use Git: `git config core.autocrlf input`

### 📦 Manual Setup (Alternative)

#### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   **Note**: Some features require additional setup:
   - **Redis** (for caching): Install Redis server or use cloud Redis
   - **Firebase Admin SDK**: Only needed if using Firebase social login
   - **drf-spectacular**: Only needed for API documentation (auto-installed)

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values (database, Cloudinary, etc.)
   ```

5. **Set up PostgreSQL database:**
   ```sql
   CREATE DATABASE barbershop_db;
   ```

6. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

8. **Start development server:**
   ```bash
   python manage.py runserver
   ```
   Backend will run on `http://localhost:8000`

#### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update API configuration:**
   Edit `client/config.js` and set the correct backend URL:
   ```javascript
   const ip_address = "localhost"; // Or your IP if testing on device
   const config = {
     apiBaseUrl: `http://${ip_address}:8000/api`,
   };
   ```

4. **Start Expo development server:**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on device/emulator:**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app on physical device

## 📁 Project Structure

```
BSBS_UPDATED/
├── backend/                 # Django REST API
│   ├── accounts/           # User authentication & management
│   ├── barbershops/        # Multi-tenant barbershop model
│   ├── services/           # Services, products, orders
│   ├── bookings/          # Booking & slot management
│   ├── payments/           # Payment processing
│   ├── notifications/      # User notifications
│   ├── config/             # Django settings
│   └── manage.py
├── client/                 # React Native mobile app
│   ├── screens/           # App screens
│   ├── components/        # Reusable components
│   ├── config.js          # API configuration
│   └── App.js             # Main app entry
└── README.md              # This file
```

## 🔑 Environment Variables

### Backend (.env)

Required variables:
- `SECRET_KEY` - Django secret key
- `DEBUG` - Set to `True` for development
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` - PostgreSQL credentials
- `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET` - Cloudinary credentials
- `CHAPA_SECRET_KEY`, `CHAPA_PUBLIC_KEY` - Chapa payment gateway (optional)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CREDENTIALS` - Firebase for social login (optional)

See `backend/.env.example` for complete list.

## 📡 API Endpoints

### Authentication
- `POST /api/customers/signup` - Customer registration
- `POST /api/customers/login` - User login
- `POST /api/customers/firebase-login` - Firebase social login
- `GET /api/customers/profile` - Get user profile
- `PUT /api/customers/update-profile` - Update profile

### Services
- `GET /api/service/get-all` - Get all services (cached)
- `POST /api/service/create` - Create service (Admin)
- `GET /api/service/:id` - Get single service

### Products
- `GET /api/product/get-all` - Get all products (cached)
- `POST /api/product/create` - Create product (Admin)
- `PUT /api/product/:id/review` - Add product review

### Bookings
- `POST /api/booking/create` - Create booking
- `GET /api/booking/availability` - Check slot availability
- `GET /api/booking/get-all` - Get all bookings (Admin)

### Orders
- `POST /api/order/create` - Create order
- `GET /api/order/my-orders` - Get user orders

### Payments (Chapa)
- `POST /api/booking/payments` - Initialize booking payment
- `POST /api/order/payments` - Initialize order payment
- `POST /api/payments/verify` - Verify payment transaction
- `POST /api/payments/webhook/chapa` - Chapa webhook handler

### API Documentation
- `GET /api/docs/` - Swagger UI (interactive API docs)
- `GET /api/redoc/` - ReDoc documentation
- `GET /api/schema/` - OpenAPI schema

## 👥 User Roles

- **Customer**: Browse services/products, book appointments, place orders
- **Barber**: View assigned bookings, manage availability
- **Admin**: Full access to manage services, products, bookings, payments

## 🗄️ Database Models

- **User**: Custom user model with roles (Customer, Barber, Admin)
- **Barbershop**: Multi-tenant barbershop model
- **Service**: Service catalog with pricing and duration
- **Product**: Product catalog with inventory management
- **Booking**: Appointment bookings with time slot management
- **Order**: E-commerce orders with shipping
- **Payment**: Payment records and audit trail
- **Notification**: User notifications

## 🔐 Security Features

- JWT authentication with 7-day token lifetime
- Role-based access control (RBAC)
- Password hashing (Django's PBKDF2)
- CORS configuration for mobile app
- Environment variable management

## 🧪 Testing

### Backend

**With Docker:**
```bash
docker compose exec backend pytest
docker compose exec backend pytest --cov=. --cov-report=html
```

**Manual Setup:**
```bash
cd backend
# Using pytest (recommended)
pytest
pytest --cov=. --cov-report=html

# Or using Django test runner
python manage.py test
```

### Frontend
```bash
cd client
npm test
```

## 📦 Deployment

### Backend

**Docker Production:**
1. Set `DEBUG=False` in `.env`
2. Configure `ALLOWED_HOSTS` with your domain in `.env`
3. Use production database credentials in `.env`
4. Build and run:
   ```bash
   docker compose -f docker-compose.prod.yml up --build
   ```
5. Configure reverse proxy (nginx/traefik) for HTTPS/SSL
6. Set up static file serving (or use Cloudinary for media)

**Manual Production:**
1. Set `DEBUG=False` in production
2. Configure `ALLOWED_HOSTS` with your domain
3. Use production database credentials
4. Set up static file serving
5. Configure HTTPS/SSL

### Frontend
1. Build for production:
   ```bash
   expo build:android
   # or
   expo build:ios
   ```
2. Or use EAS Build for modern Expo projects

## 🛠️ Development

### Backend Development

**With Docker:**
- Django admin available at http://localhost:8000/admin/
- API documentation: http://localhost:8000/api/docs/
- Database migrations: `docker compose exec backend python manage.py makemigrations && docker compose exec backend python manage.py migrate`
- Code changes are automatically reflected (volume mounting)
- View logs: `docker compose logs -f backend`

**Manual Setup:**
- Django admin available at `/admin/`
- API documentation: Use Django REST Framework browsable API
- Database migrations: `python manage.py makemigrations && python manage.py migrate`

### Frontend Development
- Hot reload enabled by default
- Expo DevTools available in browser
- React Native Debugger for debugging
- For mobile testing, run client locally (not in Docker) to connect to physical devices

## 📝 Notes

- The backend is fully migrated from Node.js/Express to Django
- All API endpoints maintain compatibility with the React Native frontend
- Multi-tenant architecture is built-in but can be activated as needed
- Payment integration (Chapa) is prepared but requires actual gateway implementation
- Firebase social login is prepared but requires Firebase SDK integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

## 📄 License

This project is private and proprietary.

## ✨ Recent Features Completed

- ✅ **Docker & Docker Compose Setup** - Full containerization for easy development and deployment
- ✅ **Chapa Payment Gateway Integration** - Full payment processing with webhooks
- ✅ **Firebase Social Login** - Google/Facebook authentication support
- ✅ **Comprehensive Test Coverage** - Unit and integration tests with pytest
- ✅ **API Documentation** - Swagger/OpenAPI with interactive docs
- ✅ **Multi-Tenant Activation** - Automatic tenant isolation and filtering
- ✅ **Redis Caching Layer** - Performance optimization for frequently accessed data

## 🐛 Known Issues / TODO

- [ ] Set up CI/CD pipeline
- [ ] Add more integration tests
- [ ] Performance monitoring and optimization
- [ ] Add rate limiting
- [ ] Implement email notifications

## 📞 Support

For issues and questions, please open an issue in the repository.
