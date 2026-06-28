import RNBootSplash from 'react-native-bootsplash';
import React, { useState, useEffect, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, Text, Image } from 'react-native';
import { nanoid } from 'nanoid/non-secure';
import { syncData } from './src/services/syncService';
import NetInfo from '@react-native-community/netinfo';
import LottieView from 'lottie-react-native';

NetInfo.addEventListener(state => {
  if (state.isConnected) syncData();
});
setInterval(syncData, 30000);

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
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
const RegisterScreen = React.lazy(
  () => import('./src/screens/admin/RegisterScreen'),
);
const RegisterKasirScreen = React.lazy(
  () => import('./src/screens/admin/RegisterKasirScreen'),
);
const SettingScreen = React.lazy(() => import('./src/screens/SettingScreen'));
const PrinterSettingScreen = React.lazy(
  () => import('./src/screens/PrinterSettingScreen'),
);
const CheckoutScreen = React.lazy(() => import('./src/screens/CheckoutScreen'));
const CustomerScreen = React.lazy(() => import('./src/screens/CustomerScreen'));
const CategoryScreen = React.lazy(() => import('./src/screens/CategoryScreen'));
const AboutScreen = React.lazy(() => import('./src/screens/AboutScreen'));

function OwnerTabNavigator({ route }: any) {
  const { onLogoutSuccess } = route.params || {};
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8, backgroundColor: theme.surface },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', color: theme.text },
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
          <Tab.Screen
            name="TabAbout"
            component={AboutScreen}
            options={{
              title: 'Tentang',
              headerShown: false,
              tabBarIcon: ({ color }) => (
                <Text style={{ color, fontSize: 20 }}>ℹ️</Text>
              ),
            }}
          />
        </Tab.Navigator>
      );
    }

    function AdminTabNavigator({ route }: any) {
  const { onLogoutSuccess } = route.params || {};
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8, backgroundColor: theme.surface },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', color: theme.text },
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
          <Tab.Screen
            name="TabAbout"
            component={AboutScreen}
            options={{
              title: 'Tentang',
              headerShown: false,
              tabBarIcon: ({ color }) => (
                <Text style={{ color, fontSize: 20 }}>ℹ️</Text>
              ),
            }}
          />
        </Tab.Navigator>
      );
    }

    function KasirTabNavigator({ route }: any) {
  const { onLogoutSuccess } = route.params || {};
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8, backgroundColor: theme.surface },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', color: theme.text },
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
          <Tab.Screen
            name="TabAbout"
            component={AboutScreen}
            options={{
              title: 'Tentang',
              headerShown: false,
              tabBarIcon: ({ color }) => (
                <Text style={{ color, fontSize: 20 }}>ℹ️</Text>
              ),
            }}
          />
        </Tab.Navigator>
      );
    }

    function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('kasir');
  const [isLoading, setIsLoading] = useState(true);

  const checkLoginStatus = async () => {
    const status = await AsyncStorage.getItem('isLoggedIn');
    const role = (await AsyncStorage.getItem('user_role')) || 'kasir';
    setUserRole(role);
    setIsLoggedIn(status === 'true');
    return { isLoggedIn: status === 'true', role: role };
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
          backgroundColor: '#F8FAFC',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{ alignItems: 'center', transform: [{ translateY: -40 }] }}
        >
          <LottieView
            source={require('./src/assets/splash-animation.json')}
            autoPlay
            loop
            style={{ width: 240, height: 240 }}
          />
            <View style={{ alignItems: 'center', transform: [{ translateY: -40 }] }}>
          <LottieView
            source={require('./src/assets/loading.json')}
            autoPlay
            loop
            style={{ width: 240, height: 240 }}
          />
          <Text style={{ marginTop: 12, fontSize: 15, fontWeight: '600', color: '#64748B', letterSpacing: 0.5 }}>
            Memuat Sistem Kasir...
          </Text>
        </View>
        </View>

        <View
          style={{ position: 'absolute', bottom: 40, alignItems: 'center' }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            Powered By
          </Text>
          <Image
            source={require('./src/assets/branding.png')}
            style={{ width: 140, height: 45 }}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContent isLoggedIn={isLoggedIn} userRole={userRole} onLogoutSuccess={checkLoginStatus} />
    </ThemeProvider>
  );
}

function NavigationContent({ isLoggedIn, userRole, onLogoutSuccess }: any) {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Suspense
        fallback={
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        }
      >
        <Stack.Navigator>
          {isLoggedIn ? (
            <>
              {userRole === 'owner' ? (
                <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
                  {props => (
                    <OwnerTabNavigator
                      {...props}
                      route={{
                        ...props.route,
                        params: { onLogoutSuccess },
                      }}
                    />
                  )}
                </Stack.Screen>
              ) : userRole === 'admin' ? (
                <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
                  {props => (
                    <AdminTabNavigator
                      {...props}
                      route={{
                        ...props.route,
                        params: { onLogoutSuccess },
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
                        params: { onLogoutSuccess },
                      }}
                    />
                  )}
                </Stack.Screen>
              )}

              <Stack.Screen
                name="RegisterKasir"
                component={RegisterKasirScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="OrderDetail"
                component={OrderDetailScreen}
                options={{ title: 'Detail Transaksi', headerShown:false }}
              />
              <Stack.Screen
                name="Report"
                component={ReportScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="EditProduct"
                component={EditProductScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Setting"
                component={SettingScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="PrinterSetting"
                component={PrinterSettingScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
                options={{ title: 'Pembayaran' }}
              />
              <Stack.Screen
                name="Customer"
                component={CustomerScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Category"
                component={CategoryScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" options={{ headerShown: false }}>
                {props => (
                  <LoginScreen {...props} onLoginSuccess={onLogoutSuccess} />
                )}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </Suspense>
    </NavigationContainer>
  );
}

export default App;
