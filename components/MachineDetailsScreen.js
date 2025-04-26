import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const MachineDetailsScreen = ({ route }) => {
  const { machine } = route.params;
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sensorData, setSensorData] = useState({
    Spindle_Speed_RPM: machine.sensorData?.Spindle_Speed_RPM?.toString() || '',
    Vibration_Level_mm_s: machine.sensorData?.Vibration_Level_mm_s?.toString() || '',
    Tool_Wear_mm: machine.sensorData?.Tool_Wear_mm?.toString() || '',
    Temperature_C: machine.sensorData?.Temperature_C?.toString() || '',
    Energy_Consumption_kWh: machine.sensorData?.Energy_Consumption_kWh?.toString() || '',
  });

  const API_URL = 'https://cnc-app-backend.azurewebsites.net/api';

  useEffect(() => {
    fetchPrediction();
  }, []);

  const fetchPrediction = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/machines/${machine._id}/predict`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setPrediction(data);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch prediction');
    } finally {
      setLoading(false);
    }
  };

  const updateSensorData = async () => {
    const sensorValues = {
      Spindle_Speed_RPM: parseFloat(sensorData.Spindle_Speed_RPM) || 0,
      Vibration_Level_mm_s: parseFloat(sensorData.Vibration_Level_mm_s) || 0,
      Tool_Wear_mm: parseFloat(sensorData.Tool_Wear_mm) || 0,
      Temperature_C: parseFloat(sensorData.Temperature_C) || 0,
      Energy_Consumption_kWh: parseFloat(sensorData.Energy_Consumption_kWh) || 0,
    };
    if (Object.values(sensorValues).every(val => val === 0)) {
      Alert.alert('Error', 'Please provide at least one sensor value');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/machines/${machine._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sensorData: sensorValues }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Sensor data updated successfully');
        fetchPrediction(); // Refresh prediction
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update sensor data');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{machine.name}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Spindle Speed (RPM)"
          value={sensorData.Spindle_Speed_RPM}
          onChangeText={(text) => setSensorData({ ...sensorData, Spindle_Speed_RPM: text })}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          placeholder="Vibration Level (mm/s)"
          value={sensorData.Vibration_Level_mm_s}
          onChangeText={(text) => setSensorData({ ...sensorData, Vibration_Level_mm_s: text })}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          placeholder="Tool Wear (mm)"
          value={sensorData.Tool_Wear_mm}
          onChangeText={(text) => setSensorData({ ...sensorData, Tool_Wear_mm: text })}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          placeholder="Temperature (°C)"
          value={sensorData.Temperature_C}
          onChangeText={(text) => setSensorData({ ...sensorData, Temperature_C: text })}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          placeholder="Energy Consumption (kWh)"
          value={sensorData.Energy_Consumption_kWh}
          onChangeText={(text) => setSensorData({ ...sensorData, Energy_Consumption_kWh: text })}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.updateButton} onPress={updateSensorData}>
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.updateButtonText}>Update Sensor Data</Text>
        </TouchableOpacity>
      </View>
      {prediction ? (
        <View style={styles.predictionContainer}>
          <Text style={styles.predictionText}>Risk Assessment: {prediction.riskLevel}</Text>
          <Text style={styles.predictionText}>Risk Probability: {prediction.riskProbability.toFixed(2)}%</Text>
          <Text style={styles.predictionText}>
            Critical Parameters: {prediction.criticalParameters.length > 0 ? prediction.criticalParameters.join(', ') : 'None'}
          </Text>
          <Text style={styles.predictionText}>Maintenance Recommendations:</Text>
          {prediction.recommendations.map((rec, index) => (
            <Text key={index} style={styles.recommendationText}>• {rec}</Text>
          ))}
        </View>
      ) : (
        <Text style={styles.errorText}>No prediction available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f2f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  updateButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  predictionContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  predictionText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
});

export default MachineDetailsScreen;