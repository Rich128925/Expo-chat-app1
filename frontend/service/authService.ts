// service/authService.ts
import { API_URL } from '@/constants'
import axios from "axios"

export const login = async (
  email: string,
  password: string
): Promise<{ token: string }> => {
  try {
    console.log("📤 Login request to:", `${API_URL}/auth/login`);
    console.log("📧 Email:", email);
    console.log("🔑 Password length:", password?.length);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log("✅ Login response status:", response.status);
    console.log("📦 Login response data:", response.data);
    
    // Check if response has token
    if (!response.data.token) {
      console.error("❌ No token in response:", response.data);
      throw new Error("No token received from server");
    }
    
    return response.data;
  } catch (error: any) {
    console.log("❌ Login error details:");
    
    if (error.response) {
      // Server responded with error
      console.log("Response status:", error.response.status);
      console.log("Response data:", error.response.data);
      console.log("Response headers:", error.response.headers);
      
      const msg = error.response.data?.msg || error.response.data?.message || `Login failed: ${error.response.status}`;
      throw new Error(msg);
    } else if (error.request) {
      // Request made but no response
      console.log("No response received from server");
      console.log("Request URL:", error.config?.url);
      throw new Error(`Cannot connect to server at ${API_URL}. Please check if backend is running.`);
    } else {
      // Something else happened
      console.log("Error message:", error.message);
      throw new Error(error.message || "Login failed");
    }
  }
}

export const register = async (
  email: string,
  password: string,
  name: string,
  avatar: string | null
): Promise<{ token: string }> => {
  try {
    console.log("📤 Register request to:", `${API_URL}/auth/register`);
    console.log("📧 Email:", email);
    console.log("👤 Name:", name);
    
    const response = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      name,
      avatar,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log("✅ Register response status:", response.status);
    console.log("📦 Register response data:", response.data);
    
    if (!response.data.token) {
      console.error("❌ No token in response:", response.data);
      throw new Error("No token received from server");
    }
    
    return response.data;
  } catch (error: any) {
    console.log("❌ Register error details:");
    
    if (error.response) {
      console.log("Response status:", error.response.status);
      console.log("Response data:", error.response.data);
      const msg = error.response.data?.msg || "Registration failed";
      throw new Error(msg);
    } else if (error.request) {
      console.log("No response received from server");
      throw new Error(`Cannot connect to server at ${API_URL}`);
    } else {
      throw new Error(error.message || "Registration failed");
    }
  }
};