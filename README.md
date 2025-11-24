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

2. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL script in `supabase-setup.sql` in your Supabase SQL Editor
   - Get your project URL and anon key from Settings > API

3. Configure environment:
```bash
copy .env.example .env
```
Update `.env` with your Supabase credentials:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

4. Create test user:
   - Hash the password `sifrasifra` using bcrypt (12 rounds)
   - Update the INSERT statement in `supabase-setup.sql` with the actual hash
   - Run the SQL script

5. Start development server:
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