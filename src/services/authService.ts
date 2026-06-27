
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveUserSession = async (userId: string) => {
  await AsyncStorage.setItem('user_session', userId);
};

export const getLoggedInUserId = async () => {
  return await AsyncStorage.getItem('user_session');
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('user_session');
};

export const clearAutoLoginSession = async () => {
  await AsyncStorage.removeItem('autologin_session');
};