const bcrypt = require('bcryptjs');

class MockDatabase {
  constructor() {
    this.connected = false;
    // Pre-hash the password for testing
    this.mockUser = {
      id: 'users:luka',
      username: 'luka.ban',
      email: 'banovic456@gmail.com',
      password: bcrypt.hashSync('sifrasifra', 12), // Hashed password
      role: 'user',
      loginAttempts: 0,
      lockoutUntil: null,
      refreshTokens: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      lastFailedLogin: null
    };
  }

  async connect() {
    this.connected = true;
    console.log('✅ Connected to Mock Database');
  }

  async disconnect() {
    this.connected = false;
  }

  getDB() {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    return {
      query: async (query, params) => {
        // Handle username-based login query
        if (query.includes('SELECT * FROM users WHERE username = $username')) {
          const { username } = params;
          if (username === this.mockUser.username) {
            return [{ result: [this.mockUser] }];
          }
          return [{ result: [] }];
        }
        
        // Handle login attempt updates
        if (query.includes('UPDATE') && query.includes('loginAttempts')) {
          const { attempts, lockoutUntil } = params;
          this.mockUser.loginAttempts = attempts;
          this.mockUser.lockoutUntil = lockoutUntil;
          console.log(`Mock DB: Updated login attempts to ${attempts}`);
          return [{ result: [] }];
        }
        
        // Handle successful login reset
        if (query.includes('UPDATE') && query.includes('lastLogin')) {
          this.mockUser.loginAttempts = 0;
          this.mockUser.lockoutUntil = null;
          this.mockUser.lastLogin = new Date().toISOString();
          console.log('Mock DB: Reset login attempts, updated last login');
          return [{ result: [] }];
        }
        
        // Handle refresh token updates
        if (query.includes('UPDATE') && query.includes('refreshTokens')) {
          const { refreshToken } = params;
          if (refreshToken) {
            this.mockUser.refreshTokens.push(refreshToken);
            console.log('Mock DB: Added refresh token');
          }
          return [{ result: [] }];
        }
        
        return [{ result: [] }];
      }
    };
  }
}

module.exports = new MockDatabase();