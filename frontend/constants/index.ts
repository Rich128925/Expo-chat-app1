import { Platform } from "react-native";

// Use YOUR actual IP from ipconfig
const YOUR_COMPUTER_IP = "10.221.193.192";

export const API_URL = `http://${YOUR_COMPUTER_IP}:4000`;

console.log(`🌐 API_URL configured: ${API_URL}`);