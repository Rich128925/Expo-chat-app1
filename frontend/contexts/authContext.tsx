import { AuthContextProps, DecodedTokenProps, UserProps } from "@/types";
import { useRouter } from "expo-router";
import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { login, register } from "@/service/authService";
import { connectSocket, disconnectSocket } from "@/socket/socket";

export const AuthContext = createContext<AuthContextProps>({
  token: null,
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateToken: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProps | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    const storedToken = await AsyncStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded = jwtDecode<DecodedTokenProps>(storedToken);
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          // token has expired, navigate to welcome page
          await AsyncStorage.removeItem("token");
          gotoWelcomePage();
          return;
        }
        // user is logged in, set token and user   
        setToken(storedToken);
        await connectSocket(); // Connect to socket if token is valid
        setUser(decoded.user);
        gotoHomePage();
      } catch (error) {
        console.log('failed to decode token:', error);
        gotoWelcomePage();
      }
    } else {
      gotoWelcomePage();
    }
  };

  const gotoHomePage = () => {
    // wait only for showing the splash screen
    setTimeout(() => {
      router.replace("/(main)/home");
    }, 1500);
  };

  const gotoWelcomePage = () => {
    // wait only for showing the splash screen
    setTimeout(() => {
      router.replace("/(auth)/welcome");
    }, 1500);
  };

  // ❌ REMOVED THE EXTRA CLOSING BRACE HERE!

  const updateToken = async (newToken: string) => {
    if (!newToken) return;

    try {
      console.log("🔄 Updating token...");
      await AsyncStorage.setItem("token", newToken);
      setToken(newToken);

      const decoded = jwtDecode<DecodedTokenProps>(newToken);
      
      // ✅ LOG THE DECODED TOKEN WITH FORMATTING
      console.log("=".repeat(50));
      console.log("🔓 DECODED TOKEN:");
      console.log("=".repeat(50));
      console.log("📧 Email:", decoded.user.email);
      console.log("👤 Name:", decoded.user.name);
      console.log("🆔 User ID:", decoded.user.id);
      console.log("🖼️ Avatar:", decoded.user.avatar || "No avatar");
      console.log("⏰ Issued at:", new Date(decoded.iat * 1000).toLocaleString());
      console.log("⏰ Expires at:", new Date(decoded.exp * 1000).toLocaleString());
      console.log("=".repeat(50));
      
      setUser(decoded.user);
    } catch (error) {
      console.error("❌ Error updating token:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔐 Attempting sign in for:", email);
      const response = await login(email, password);
      console.log("✅ Sign in successful, updating token");
      await updateToken(response.token);
      await connectSocket(); // Connect to socket after successful login
      console.log("📱 Navigating to home");
      router.push("/(main)/home");
    } catch (error: any) {
      console.error("❌ Sign in error:", error.message);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    avatar?: string | null
  ) => {
    try {
      console.log("📝 Attempting sign up for:", email);
      const response = await register(email, password, name, avatar || null);
      console.log("✅ Sign up successful, updating token");
      await updateToken(response.token);
      console.log("📱 Navigating to home");
      router.push("/(main)/home");
    } catch (error: any) {
      console.error("❌ Sign up error:", error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("🚪 Signing out");
      await AsyncStorage.removeItem("token");
      setToken(null);
      setUser(null);
      disconnectSocket(); // Disconnect from socket on sign out
      router.replace("/(auth)/welcome");
    } catch (error) {
      console.error("❌ Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        signIn,
        signUp,
        signOut,
        updateToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);