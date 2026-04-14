export const LOCAL_API_URL = "http://10.152.165.192:4000";
export const PROD_API_URL = "https://expo-chat-app1.vercel.app";
export const API_URL = __DEV__ ? LOCAL_API_URL : PROD_API_URL;

export const CLOUDINARY_CLOUD_NAME = 'dxtdvnwvf';
export const CLOUDINARY_UPLOAD_PRESET = 'images';

console.log(`🌐 API_URL: ${API_URL}`);