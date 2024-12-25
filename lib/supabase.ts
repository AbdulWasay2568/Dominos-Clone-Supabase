import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gyyoejjqnqbvfybigexs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eW9lampxbnFidmZ5YmlnZXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEyNDg2OTUsImV4cCI6MjA0NjgyNDY5NX0.1rC7JJVrNnRs78chj07LPRDKShQClB5kypT3bE-HKz4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})