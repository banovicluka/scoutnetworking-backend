class MockDatabase {
  constructor() {
    this.connected = false;
    this.mockUser = {
      id: 'users:luka',
      username: 'luka.ban',
      email: 'banovic456@gmail.com',
      password: 'sifrasifra',
      role: 'user',
      loginAttempts: 0,
      lockoutUntil: null,
      refreshTokens: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
        if (query.includes('SELECT * FROM users WHERE email = $email OR username = $email')) {
          const { email } = params;
          if (email === this.mockUser.email || email === this.mockUser.username) {
            return [{ result: [this.mockUser] }];
          }
          return [{ result: [] }];
        }
        if (query.includes('UPDATE') && query.includes('loginAttempts')) {
          return [{ result: [] }];
        }
        if (query.includes('UPDATE') && query.includes('refreshTokens')) {
          return [{ result: [] }];
        }
        return [{ result: [] }];
      }
    };
  }
}

module.exports = new MockDatabase();