#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAuthentication() {
  console.log('🧪 Testing Authentication Endpoint\n');

  try {
    // Test 1: Valid credentials
    console.log('1. Testing valid credentials...');
    const validResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'fkzeljeznicar',
      password: 'sifrasifra'
    });
    
    console.log('✅ Valid login successful');
    console.log('Response:', {
      success: validResponse.data.success,
      user: validResponse.data.user,
      hasAccessToken: !!validResponse.data.accessToken,
      hasRefreshToken: !!validResponse.data.refreshToken
    });
    console.log();

    // Test 2: Invalid username
    console.log('2. Testing invalid username...');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        username: 'nonexistent',
        password: 'sifrasifra'
      });
    } catch (error) {
      console.log('✅ Invalid username correctly rejected');
      console.log('Error:', error.response.data.error);
    }
    console.log();

    // Test 3: Invalid password
    console.log('3. Testing invalid password...');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        username: 'fkzeljeznicar',
        password: 'wrongpassword'
      });
    } catch (error) {
      console.log('✅ Invalid password correctly rejected');
      console.log('Error:', error.response.data.error);
    }
    console.log();

    // Test 4: Invalid input validation
    console.log('4. Testing input validation...');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        username: 'ab', // Too short
        password: '123' // Too short
      });
    } catch (error) {
      console.log('✅ Input validation working');
      console.log('Error:', error.response.data.error);
      console.log('Details:', error.response.data.details);
    }
    console.log();

    // Test 5: Health check
    console.log('5. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check successful');
    console.log('Status:', healthResponse.data.status);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running: npm run dev');
    }
  }
}

// Run tests
testAuthentication();