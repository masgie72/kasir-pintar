import RNBootSplash from 'react-native-bootsplash';
import React, { useState, useEffect, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { nanoid } from 'nanoid/non-secure';
import { syncData } from './src/services/syncService';
import NetInfo from '@react-native-community/netinfo';

NetInfo.addEventListener(state => {
  if (state.isConnected) syncData();
});
setInterval(syncData, 30000);

import { database } from './src/database';
import { inisialisasiSuperUser } from './src/database/dbSeeder';

const Stack = createNativeStackNavigator();

const DashboardScreen = React.lazy(
  () => import('./src/screens/DashboardScreen'),
);
const HomeScreen = React.lazy(() => import('./src/screens/KasirScreen'));
const HistoryScreen = React.lazy(() => import('./src/screens/HistoryScreen'));
const OrderDetailScreen = React.lazy(
  () => import('./src/screens/OrderDetailScreen'),
);
const ProductScreen = React.lazy(() => import('./src/screens/ProductScreen'));
const ReportScreen = React.lazy(() => import('./src/screens/ReportScreen'));
const LoginScreen = React.lazy(() => import('./src/screens/LoginScreen'));
const EditProductScreen = React.lazy(
  () => import('./src/screens/EditProductScreen'),
);
const RegisterScreen = React.lazy(() => import('./src/screens/RegisterScreen'));
const SettingScreen = React.lazy(() => import('./src/screens/SettingScreen'));
const PrinterSettingScreen = React.lazy(
  () => import('./src/screens/PrinterSettingScreen'),
);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Kasih nama HP (pindah ke sini)
        let deviceId = await AsyncStorage.getItem('device_id');
        if (!deviceId) {
          deviceId = 'KASIR-' + nanoid(4);
          await AsyncStorage.setItem('device_id', deviceId);
        }
        console.log('[DEVICE]', deviceId);

        // 2. DB
        console.log('[DB] Setup start');
        await inisialisasiSuperUser(database);
        console.log('[DB] SuperUser ready');

        const status = await AsyncStorage.getItem('isLoggedIn');
        setIsLoggedIn(status === 'true');
      } catch (e) {
        console.error('Gagal init:', e);
      } finally {
        setIsLoading(false);
        RNBootSplash.hide({ fade: true });
      }
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
        }}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Suspense
        fallback={
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
            }}
          >
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        }
      >
        <Stack.Navigator>
          {isLoggedIn ? (
            <>
              <Stack.Screen name="Dashboard" options={{ headerShown: false }}>
                {props => (
                  <DashboardScreen
                    {...props}
                    onLogoutSuccess={() => setIsLoggedIn(false)}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Home" options={{ title: 'Kasir' }}>
                {props => (
                  <HomeScreen
                    {...props}
                    onLogoutSuccess={() => setIsLoggedIn(false)}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Product" component={ProductScreen} />
              <Stack.Screen
                name="History"
                component={HistoryScreen}
                options={{ title: 'Riwayat Transaksi', headerShown: false }}
              />
              <Stack.Screen
                name="OrderDetail"
                component={OrderDetailScreen}
                options={{ title: 'Detail Transaksi' }}
              />
              <Stack.Screen
                name="Report"
                component={ReportScreen}
                options={{ title: 'Laporan Omzet' }}
              />
              <Stack.Screen
                name="EditProduct"
                component={EditProductScreen}
                options={{ title: 'Edit Produk' }}
              />
              <Stack.Screen
                name="Setting"
                component={SettingScreen}
                options={{ title: 'Pengaturan Kasir' }}
              />
              <Stack.Screen
                name="PrinterSetting"
                component={PrinterSettingScreen}
                options={{ title: 'Pengaturan Printer Bluetooth' }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" options={{ headerShown: false }}>
                {props => (
                  <LoginScreen
                    {...props}
                    onLoginSuccess={() => setIsLoggedIn(true)}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </Suspense>
    </NavigationContainer>
  );
}
