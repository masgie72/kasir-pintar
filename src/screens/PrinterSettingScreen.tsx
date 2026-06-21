import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, Alert } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrinterSettingScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanDevices = async () => {
    setIsScanning(true);
    try {
      const foundDevices = await RNBluetoothClassic.startDiscovery();
      setDevices(foundDevices);
    } catch (err) {
      Alert.alert("Gagal Scan", "Pastikan Bluetooth aktif.");
    } finally {
      setIsScanning(false);
    }
  };

  const savePrinter = async (device: any) => {
    await AsyncStorage.setItem('printerAddress', device.address);
    Alert.alert("Sukses", `Printer ${device.name} disimpan!`);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title={isScanning ? "Mencari..." : "Scan Printer"} onPress={scanDevices} />
      <FlatList
        data={devices}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => savePrinter(item)}
            style={{ padding: 15, borderBottomWidth: 1, borderColor: '#ccc' }}
          >
            <Text style={{ fontWeight: 'bold' }}>{item.name || 'Unknown Device'}</Text>
            <Text>{item.address}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}