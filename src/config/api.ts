import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine localhost
// iOS simulator and web use localhost directly
const getBaseUrl = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
};

export const API_BASE_URL = getBaseUrl();
export const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');
