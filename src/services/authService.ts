
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveUserSession = async (userId: string) => {
  await AsyncStorage.setItem('user_session', userId);
};

export const getLoggedInUserId = async () => {
  return await AsyncStorage.getItem('user_session');
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('user_session');
  await AsyncStorage.removeItem('isLoggedIn');
  await AsyncStorage.removeItem('user_role');
  await AsyncStorage.removeItem('user_name');
  await AsyncStorage.removeItem('user_id');
};

export const clearAutoLoginSession = async () => {
  await AsyncStorage.removeItem('autologin_session');
};