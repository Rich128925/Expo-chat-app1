import { AuthContextProps, DecodedTokenProps, UserProps } from "@/types";
import { useRouter } from "expo-router";
import { createContext, ReactNode, useContext, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { login, register } from "@/service/authService";

export const AuthContext = createContext<AuthContextProps>({
  token: null,
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateToken: async () => {},
});



export const AuthProvider = ({ children }: {children: ReactNode}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProps | null>(null);
  const router = useRouter();

  const updateToken = async (newToken: string) => {
    if (!newToken) return;

    await AsyncStorage.setItem("token", newToken);
    setToken(newToken);

    const decoded = jwtDecode<DecodedTokenProps>(newToken);
    setUser(decoded.user);
  };

  const signIn = async (email: string, password: string) => {
    const response = await login(email, password);
    await updateToken(response.token);
    router.push("/(main)/home");
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    avatar?: string | null
  ) => {
    const response = await register(email, password, name, avatar || null);
    await updateToken(response.token);
    router.push("/(main)/home");
  };

  const signOut = async () => {
    await AsyncStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.replace("/(auth)/welcome");
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

export const useAuth = () => useContext(AuthContext)