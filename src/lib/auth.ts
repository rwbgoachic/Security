import { supabase } from './supabase';
import { HSM } from './hsm';

interface Credentials {
  email: string;
  password: string;
}

export const secureLogin = async (credentials: Credentials) => {
  try {
    // Encrypt credentials using environment variable key
    const encryptedCreds = await HSM.encrypt(
      JSON.stringify(credentials),
      import.meta.env.VITE_HSM_KEY
    );

    // In a real-world scenario, you would send the encrypted credentials to your server
    // For this demo, we'll decrypt them here and use Supabase auth
    const decryptedCreds = JSON.parse(
      await HSM.decrypt(encryptedCreds, import.meta.env.VITE_HSM_KEY)
    ) as Credentials;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: decryptedCreds.email,
      password: decryptedCreds.password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export const secureSignUp = async (credentials: Credentials) => {
  try {
    const encryptedCreds = await HSM.encrypt(
      JSON.stringify(credentials),
      import.meta.env.VITE_HSM_KEY
    );
    
    // Decrypt and process signup
    const decryptedCreds = JSON.parse(
      await HSM.decrypt(encryptedCreds, import.meta.env.VITE_HSM_KEY)
    ) as Credentials;

    const { data, error } = await supabase.auth.signUp({
      email: decryptedCreds.email,
      password: decryptedCreds.password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}