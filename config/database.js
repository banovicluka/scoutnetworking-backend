const { createClient } = require('@supabase/supabase-js');

class SupabaseDatabase {
  constructor() {
    this.supabase = null;
    this.connected = false;
  }

  async connect() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials in environment variables');
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.connected = true;
      console.log('✅ Connected to Supabase');
    } catch (error) {
      console.error('❌ Failed to connect to Supabase:', error.message);
      throw error;
    }
  }

  async disconnect() {
    this.connected = false;
    this.supabase = null;
  }

  getDB() {
    if (!this.connected || !this.supabase) {
      throw new Error('Database not connected');
    }
    return this.supabase;
  }
}

module.exports = new SupabaseDatabase();