# Barbershop Management System

A full-stack mobile application for managing barbershop operations, including service bookings, product sales, and appointment scheduling. Built with React Native (Expo) and Django REST Framework.

## 🏗️ Architecture

- **Frontend**: React Native with Expo
- **Backend**: Django REST Framework with PostgreSQL
- **Authentication**: JWT tokens
- **Image Storage**: Cloudinary
- **Payment Gateway**: Chapa (Ethiopian payment gateway)

## 📋 Prerequisites

- Python 3.10+
- Node.js 16+
- PostgreSQL 12+
- Expo CLI (`npm install -g expo-cli`)
- Git

## 🚀 Quick Start

### Backend Setup

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

### Frontend Setup

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
- `GET /api/customers/profile` - Get user profile
- `PUT /api/customers/update-profile` - Update profile

### Services
- `GET /api/service/get-all` - Get all services
- `POST /api/service/create` - Create service (Admin)
- `GET /api/service/:id` - Get single service

### Products
- `GET /api/product/get-all` - Get all products
- `POST /api/product/create` - Create product (Admin)
- `PUT /api/product/:id/review` - Add product review

### Bookings
- `POST /api/booking/create` - Create booking
- `GET /api/booking/availability` - Check slot availability
- `GET /api/booking/get-all` - Get all bookings (Admin)

### Orders
- `POST /api/order/create` - Create order
- `GET /api/order/my-orders` - Get user orders

### Payments
- `POST /api/booking/payments` - Process booking payment
- `POST /api/order/payments` - Process order payment

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
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd client
npm test
```

## 📦 Deployment

### Backend
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
- Django admin available at `/admin/`
- API documentation: Use Django REST Framework browsable API
- Database migrations: `python manage.py makemigrations && python manage.py migrate`

### Frontend Development
- Hot reload enabled by default
- Expo DevTools available in browser
- React Native Debugger for debugging

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

This project is private and proprietary.

## 👤 Author

Developed as a university project, migrated to Django for professional portfolio.

## 🐛 Known Issues / TODO

- [ ] Complete Chapa payment gateway integration
- [ ] Implement Firebase social login
- [ ] Add comprehensive test coverage
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement multi-tenant activation
- [ ] Add caching layer for performance
- [ ] Set up CI/CD pipeline

## 📞 Support

For issues and questions, please open an issue in the repository.
