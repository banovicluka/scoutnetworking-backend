# ScoutNetworking Backend

Secure authentication backend for ScoutNetworking platform.

## Security Features

- **JWT Authentication** with access/refresh token rotation
- **Password Security** - bcrypt hashing with 12 rounds
- **Rate Limiting** - Login attempts and general API limits
- **Account Lockout** - Temporary lockout after failed attempts
- **Input Validation** - Email and password strength validation
- **Security Headers** - Helmet.js protection
- **CORS Protection** - Configured for specific origins
- **Role-based Access** - User, Scout, Admin roles

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start SurrealDB:
```bash
surreal start --log trace --user root --pass root memory
```

3. Copy environment file:
```bash
copy .env.example .env
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Health Check
- `GET /health` - Server health status

## Test Authentication

```bash
# Test the login endpoint
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "luka.ban", "password": "sifrasifra"}'

# Or run the test script
npm run test:auth
```

## Authentication Requirements

### Username
- 3-50 characters
- Letters, numbers, dots, underscores, or hyphens only

### Password
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Test Credentials
- Username: `luka.ban`
- Password: `sifrasifra`

## Environment Variables

See `.env.example` for required configuration.