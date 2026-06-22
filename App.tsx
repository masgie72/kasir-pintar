import RNBootSplash from 'react-native-bootsplash';
import React, { useState, useEffect, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, Text } from 'react-native';
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
const Tab = createBottomTabNavigator();

const DashboardScreen = React.lazy(
  () => import('./src/screens/DashboardScreen'),
);
const KasirScreen = React.lazy(() => import('./src/screens/KasirScreen'));
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

// TAB NAVIGATOR KHUSUS OWNER (Ada Dashboard & Stok)
function OwnerTabNavigator({ route }: any) {
  const { onLogoutSuccess } = route.params || {};
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="TabDashboard"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📊</Text>
          ),
        }}
      >
        {props => (
          <DashboardScreen {...props} onLogoutSuccess={onLogoutSuccess} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="TabKasir"
        options={{
          title: 'Kasir',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🏪</Text>
          ),
        }}
      >
        {props => <KasirScreen {...props} onLogoutSuccess={onLogoutSuccess} />}
      </Tab.Screen>
      <Tab.Screen
        name="TabProduct"
        component={ProductScreen}
        options={{
          title: 'Stok',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name="TabHistory"
        component={HistoryScreen}
        options={{
          title: 'Riwayat',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📋</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// TAB NAVIGATOR KHUSUS KASIR (Hanya Kasir & Riwayat, Tidak Ada Dashboard/Stok)
function KasirTabNavigator({ route }: any) {
  const { onLogoutSuccess } = route.params || {};
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="TabKasir"
        options={{
          title: 'Kasir',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🏪</Text>
          ),
        }}
      >
        {props => <KasirScreen {...props} onLogoutSuccess={onLogoutSuccess} />}
      </Tab.Screen>
      <Tab.Screen
        name="TabHistory"
        component={HistoryScreen}
        options={{
          title: 'Riwayat',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📋</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('kasir'); // State baru untuk menampung role ('owner' / 'kasir')
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi penyegar status login agar bisa di-trigger dari LoginScreen
  const checkLoginStatus = async () => {
    const status = await AsyncStorage.getItem('isLoggedIn');
    const role = (await AsyncStorage.getItem('user_role')) || 'kasir'; // Mengambil role pendukung
    setUserRole(role);
    setIsLoggedIn(status === 'true');
  };

  useEffect(() => {
    const init = async () => {
      try {
        let deviceId = await AsyncStorage.getItem('device_id');
        if (!deviceId) {
          deviceId = 'KASIR-' + nanoid(4);
          await AsyncStorage.setItem('device_id', deviceId);
        }
        console.log('[DEVICE]', deviceId);

        console.log('[DB] Setup start');
        await inisialisasiSuperUser(database);
        console.log('[DB] SuperUser ready');

        await checkLoginStatus();
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
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        }
      >
        <Stack.Navigator>
          {isLoggedIn ? (
            <>
              {/* PENGONDISIAN UTAMA BERDASARKAN USER ROLE */}
              {userRole === 'owner' ? (
                <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
                  {props => (
                    <OwnerTabNavigator
                      {...props}
                      route={{
                        ...props.route,
                        params: { onLogoutSuccess: checkLoginStatus },
                      }}
                    />
                  )}
                </Stack.Screen>
              ) : (
                <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
                  {props => (
                    <KasirTabNavigator
                      {...props}
                      route={{
                        ...props.route,
                        params: { onLogoutSuccess: checkLoginStatus },
                      }}
                    />
                  )}
                </Stack.Screen>
              )}

              {/* Stack Screen pendukung lainnya */}
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
                options={{ title: 'Pengaturan Printer' }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" options={{ headerShown: false }}>
                {props => (
                  <LoginScreen
                    {...props}
                    onLoginSuccess={checkLoginStatus} // Memicu fungsi refresh status setelah login sukses
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
