import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  Modal,
  Dimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Geolocation from '@react-native-community/geolocation';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import MapView, { Polyline, Marker, Circle, Region } from 'react-native-maps';
import CustomHeader from '@app/components/CustomHeader';
import { Colors, Fonts, Images } from '@app/themes';

const { width, height } = Dimensions.get('window');

// Type definitions
interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
  speed?: number;
}

interface PathStats {
  distance: number;
  avgSpeed: number;
  maxSpeed: number;
}

interface GeofenceData {
  district_id: number;
  municipality_id: number;
  [key: string]: string | number;
  description: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  geofence_polygon: string;
  geofence_type: string;
  tracking_duration_seconds: number;
  coordinates_count: number;
  total_distance_meters: number;
  average_speed_ms: string;
  max_speed_ms: string;
  created_at: string;
}

type LocationType = 'Park' | 'Stretch' | 'Water collection point';
type StepType = 'selection' | 'map' | 'tracking' | 'completed';

interface LocationOptions {
  Park: string[];
  Stretch: string[];
  'Water collection point': string[];
}

interface MapCoordinate {
  latitude: number;
  longitude: number;
}

const GeofenceTracker: React.FC = () => {
  // State definitions with proper types
  const [selectedType, setSelectedType] = useState<LocationType | ''>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<StepType>('selection');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [coordinates, setCoordinates] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [submittedData, setSubmittedData] = useState<GeofenceData | null>(null);
  const [showDataModal, setShowDataModal] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 22.5726,
    longitude: 88.3639,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [pathStats, setPathStats] = useState<PathStats>({
    distance: 0,
    avgSpeed: 0,
    maxSpeed: 0
  });
  
  // Refs with proper types
  const timerRef = useRef<number | null>(null);
  const watchId = useRef<number | null>(null);
  const mapRef = useRef<MapView | null>(null);

  // Sample data for dropdowns based on type
  const locationOptions: LocationOptions = {
    Park: [
      'Central City Park',
      'Riverside Park',
      'Community Garden Park',
      'Sports Complex Park',
      'Children\'s Play Park'
    ],
    Stretch: [
      'Main Street Stretch',
      'Highway 101 Stretch',
      'Riverside Walk Stretch',
      'Market Road Stretch',
      'Industrial Area Stretch'
    ],
    'Water collection point': [
      'Municipal Water Tank',
      'Community Well Point',
      'Reservoir Collection Point',
      'Bore Well Station',
      'Water Treatment Plant'
    ]
  };

  // Function to get current page title
  const getCurrentPageTitle = (): string => {
    switch (currentStep) {
      case 'selection':
        return 'Geofence Tracker';
      case 'map':
        return 'Map View';
      case 'tracking':
        return 'Tracking in Progress';
      case 'completed':
        return 'Tracking Completed';
      default:
        return 'Geofence Tracker';
    }
  };

  // Function to handle back navigation
  const handleBackPress = (): void => {
    if (currentStep === 'selection') {
      // Navigate to previous screen or exit app
      Alert.alert('Exit', 'Do you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => {/* Handle exit */} }
      ]);
    } else {
      resetToSelection();
    }
  };

  // Request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const result = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      );
      
      if (result === RESULTS.GRANTED) {
        return true;
      } else {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for geofencing functionality.'
        );
        return false;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  // Get current location once
  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position: { coords: { latitude: any; longitude: any; accuracy: any; }; }) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          resolve(location);
        },
        (error: any) => {
          console.error('Error getting location:', error);
          reject(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 1000
        }
      );
    });
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Update path statistics
  const updatePathStats = (newCoords: Location[]): void => {
    if (newCoords.length < 2) return;

    let totalDistance = 0;
    let maxSpeed = 0;

    for (let i = 1; i < newCoords.length; i++) {
      const distance = calculateDistance(
        newCoords[i-1].lat, newCoords[i-1].lng,
        newCoords[i].lat, newCoords[i].lng
      );
      totalDistance += distance;

      if (newCoords[i].timestamp && newCoords[i-1].timestamp) {
        const timeDiff = (newCoords[i].timestamp! - newCoords[i-1].timestamp!) / 1000;
        if (timeDiff > 0) {
          const speed = distance / timeDiff;
          maxSpeed = Math.max(maxSpeed, speed);
        }
      }
    }

    const avgSpeed = timer > 0 ? totalDistance / timer : 0;

    setPathStats({
      distance: totalDistance,
      avgSpeed: avgSpeed,
      maxSpeed: maxSpeed
    });
  };

  // Timer effect
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTracking]);

  // Update stats when coordinates change
  useEffect(() => {
    if (coordinates.length > 1) {
      updatePathStats(coordinates);
    }
  }, [coordinates, timer]);

  // Update map region when location changes
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      const newRegion: Region = {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setMapRegion(newRegion);
      
      if (isTracking) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  }, [currentLocation, isTracking]);

  // Format timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Proceed to map view
  const proceedToMap = async (): Promise<void> => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      
      const newRegion: Region = {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setMapRegion(newRegion);
      
      setCurrentStep('map');
      setShowMapModal(true);
    } catch (error) {
      Alert.alert(
        'Location Error',
        'Unable to get current location. Please check your location settings.'
      );
    }
  };

  // Start walking/tracking
  const startWalking = (): void => {
    setIsTracking(true);
    setTimer(0);
    setCoordinates([]);
    setPathStats({ distance: 0, avgSpeed: 0, maxSpeed: 0 });
    setCurrentStep('tracking');

    watchId.current = Geolocation.watchPosition(
      (position: { coords: { latitude: any; longitude: any; accuracy: any; speed: any; }; }) => {
        const newCoord: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0
        };
        
        setCurrentLocation(newCoord);
        setCoordinates(prev => [...prev, newCoord]);
      },
      (error: any) => {
        console.error('Error getting location:', error);
        Alert.alert(
          'Location Error',
          'Error getting location. Please check your location settings.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
        distanceFilter: 1,
        interval : 1000
      }
    );
  };

  // Stop walking/tracking
  const stopWalking = (): void => {
    setIsTracking(false);
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
    }
    setCurrentStep('completed');
  };

  // Create polygon string from coordinates
  const createPolygonString = (coords: Location[]): string => {
    if (coords.length < 3) return '';
    
    const polygonCoords = coords.map(coord => `${coord.lng} ${coord.lat}`).join(', ');
    return `POLYGON((${polygonCoords}, ${coords[0].lng} ${coords[0].lat}))`;
  };

  // Calculate approximate radius from coordinates
  const calculateRadius = (coords: Location[]): number => {
    if (coords.length < 2) return 50;
    
    let maxDistance = 0;
    const center = coords[0];
    
    coords.forEach(coord => {
      const distance = calculateDistance(center.lat, center.lng, coord.lat, coord.lng);
      maxDistance = Math.max(maxDistance, distance);
    });
    
    return Math.round(maxDistance) || 50;
  };

  // Submit geofence data
  const submitData = (): void => {
    if (!currentLocation || coordinates.length === 0) {
      Alert.alert(
        'No Data',
        'No location data available. Please track an area first.'
      );
      return;
    }

    const dynamicPropertyName = `${selectedType.toLowerCase().replace(' ', '_')}_name`;
    
    const geofenceData: GeofenceData = {
      district_id: 24,
      municipality_id: 139,
      [dynamicPropertyName]: selectedName,
      description: `Geofenced area for ${selectedName}`,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      radius_meters: calculateRadius(coordinates),
      geofence_polygon: createPolygonString(coordinates),
      geofence_type: "polygon",
      tracking_duration_seconds: timer,
      coordinates_count: coordinates.length,
      total_distance_meters: Math.round(pathStats.distance),
      average_speed_ms: pathStats.avgSpeed.toFixed(2),
      max_speed_ms: pathStats.maxSpeed.toFixed(2),
      created_at: new Date().toISOString()
    };

    setSubmittedData(geofenceData);
    setShowMapModal(false);
    setShowDataModal(true);
    
    // Reset form
    setSelectedType('');
    setSelectedName('');
    setTimer(0);
    setCoordinates([]);
    setCurrentLocation(null);
    setPathStats({ distance: 0, avgSpeed: 0, maxSpeed: 0 });
    setCurrentStep('selection');
  };

  // Convert coordinates for polyline
  const getPolylineCoordinates = (): MapCoordinate[] => {
    return coordinates.map(coord => ({
      latitude: coord.lat,
      longitude: coord.lng
    }));
  };

  // Reset to selection
  const resetToSelection = (): void => {
    if (isTracking) {
      stopWalking();
    }
    setShowMapModal(false);
    setCurrentStep('selection');
    setCoordinates([]);
    setCurrentLocation(null);
    setTimer(0);
    setPathStats({ distance: 0, avgSpeed: 0, maxSpeed: 0 });
  };

  // Handle type selection
  const handleTypeSelection = (value: LocationType | ''): void => {
    setSelectedType(value);
    setSelectedName('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={Images.greenbg} style={{flex:1}}>
      {/* Custom Header */}
      <CustomHeader
        title={getCurrentPageTitle()}
        onBackPress={handleBackPress}
        showBackButton={currentStep !== 'selection'}
        rightComponent={
          isTracking ? (
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          ) : undefined
        }
      />
      
      {/* Selection Screen */}
      {currentStep === 'selection' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📍</Text>
            </View>
            <Text style={styles.subtitle}>Track and map area boundaries</Text>
          </View>

          {/* Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Location Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedType}
                onValueChange={handleTypeSelection}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Choose a type..." value="" style={styles.pickerItemStyle} />
                <Picker.Item label="Park" value="Park" style={styles.pickerItemStyle} />
                <Picker.Item label="Stretch" value="Stretch" style={styles.pickerItemStyle} />
                <Picker.Item label="Water Collection Point" value="Water collection point" style={styles.pickerItemStyle} />
              </Picker>
            </View>
          </View>

          {/* Name Selection */}
          {selectedType && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select {selectedType} Name</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedName}
                  onValueChange={setSelectedName}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item 
                    label={`Choose a ${selectedType.toLowerCase()}...`} 
                    value="" 
                    style={styles.pickerItemStyle}
                  />
                  {locationOptions[selectedType as LocationType].map((name: string, index: number) => (
                    <Picker.Item 
                      key={index} 
                      label={name} 
                      value={name} 
                      style={styles.pickerItemStyle}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {/* Proceed Button */}
          <TouchableOpacity
            style={[
              styles.button,
              styles.proceedButton,
              (!selectedType || !selectedName) && styles.disabledButton
            ]}
            onPress={proceedToMap}
            disabled={!selectedType || !selectedName}
          >
            <Text style={styles.buttonText}>🗺️ Proceed to Map View</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={resetToSelection}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Map Header */}
          <CustomHeader
            title={`${selectedType}: ${selectedName}`}
            onBackPress={resetToSelection}
            showBackButton={true}
            rightComponent={
              isTracking ? (
                <Text style={styles.timerTextWhite}>{formatTime(timer)}</Text>
              ) : undefined
            }
            backgroundColor="#1f2937"
          />
          
          {/* Map Container */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={mapRegion}
              showsUserLocation={true}
              showsMyLocationButton={true}
              followsUserLocation={isTracking}
              mapType="standard"
            >
              {/* Walking Path Polyline */}
              {coordinates.length > 1 && (
                <Polyline
                  coordinates={getPolylineCoordinates()}
                  strokeColor="#2563eb"
                  strokeWidth={4}
                  lineDashPattern={[5, 5]}
                />
              )}
              
              {/* Start Point Marker */}
              {coordinates.length > 0 && (
                <Marker
                  coordinate={{
                    latitude: coordinates[0].lat,
                    longitude: coordinates[0].lng
                  }}
                  title="Start Point"
                  pinColor="green"
                />
              )}
              
              {/* Current/End Point Marker */}
              {currentLocation && (
                <Marker
                  coordinate={{
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng
                  }}
                  title={isTracking ? "Current Position" : "End Point"}
                  pinColor={isTracking ? "blue" : "red"}
                />
              )}
              
              {/* Geofence Circle */}
              {currentStep === 'completed' && coordinates.length > 0 && (
                <Circle
                  center={{
                    latitude: coordinates[0].lat,
                    longitude: coordinates[0].lng
                  }}
                  radius={calculateRadius(coordinates)}
                  strokeColor="rgba(37, 99, 235, 0.5)"
                  fillColor="rgba(37, 99, 235, 0.1)"
                />
              )}
            </MapView>
            
            {/* Map Overlay Info */}
            <View style={styles.mapOverlay}>
              <View style={styles.mapInfo}>
                <Text style={styles.mapInfoText}>
                  Timer: {formatTime(timer)}
                </Text>
                <Text style={styles.mapInfoText}>
                  Points: {coordinates.length}
                </Text>
                {coordinates.length > 1 && (
                  <Text style={styles.mapInfoText}>
                    Distance: {pathStats.distance.toFixed(0)}m
                  </Text>
                )}
                {currentStep === 'completed' && coordinates.length > 0 && (
                  <Text style={styles.mapInfoText}>
                    Radius: {calculateRadius(coordinates)}m
                  </Text>
                )}
              </View>
            </View>

            {/* Status Banner */}
            <View style={styles.statusBanner}>
              {currentStep === 'map' && (
                <Text style={styles.statusText}>📍 Ready to start walking. Tap "Start Walking" to begin tracking.</Text>
              )}
              {currentStep === 'tracking' && (
                <Text style={styles.statusText}>🚶‍♂️ Walking... Your path is being tracked on the map!</Text>
              )}
              {currentStep === 'completed' && (
                <Text style={styles.statusText}>✅ Walking completed! Review your path and submit the data.</Text>
              )}
            </View>
          </View>
          
          {/* Map Bottom Controls */}
          <View style={styles.mapBottomControls}>
            {currentStep === 'map' && (
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={startWalking}
              >
                <Text style={styles.buttonText}>▶️ Start Walking</Text>
              </TouchableOpacity>
            )}

            {currentStep === 'tracking' && (
              <TouchableOpacity
                style={[styles.button, styles.stopButton]}
                onPress={stopWalking}
              >
                <Text style={styles.buttonText}>⏹️ Stop Walking</Text>
              </TouchableOpacity>
            )}

            {currentStep === 'completed' && (
              <View style={styles.completedControls}>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton, styles.flexButton]}
                  onPress={submitData}
                >
                  <Text style={styles.buttonText}>📤 Submit Data</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.resetButton, styles.flexButton]}
                  onPress={resetToSelection}
                >
                  <Text style={styles.buttonText}>🔄 New Track</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Submitted Data Modal */}
      <Modal
        visible={showDataModal}
        animationType="slide"
        onRequestClose={() => setShowDataModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <CustomHeader
            title="Submitted Geofence Data"
            onBackPress={() => setShowDataModal(false)}
            showBackButton={true}
            backgroundColor="#16a34a"
          />
          <ScrollView style={styles.modalContent}>
            <Text style={styles.dataText}>
              {JSON.stringify(submittedData, null, 2)}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#dbeafe',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconText: {
    fontSize: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  subtitle: {
    fontFamily:Fonts.MulishSemiBold,
    fontSize: 16,
    color: Colors.greytext2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 60,
    color: '#1f2937',
    backgroundColor: 'transparent',
  },
  // iOS specific picker item styling
  pickerItem: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    height: 180,
  },
  // Android specific picker item styling
  pickerItemStyle: {
    fontSize: 16,
    color: '#1f2937',
  },
  button: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  proceedButton: {
    backgroundColor: '#7c3aed',
  },
  startButton: {
    backgroundColor: '#16a34a',
  },
  stopButton: {
    backgroundColor: '#dc2626',
  },
  submitButton: {
    backgroundColor: '#2563eb',
  },
  resetButton: {
    backgroundColor: '#6b7280',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
  },
  mapInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  mapInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginHorizontal: 5,
  },
  statusBanner: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderRadius: 8,
    padding: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  mapBottomControls: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  completedControls: {
    flexDirection: 'row',
    gap: 10,
  },
  flexButton: {
    flex: 1,
    marginBottom: 0,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  dataText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: 'center',
    minWidth: 60,
  },
  timerTextWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: 'center',
    minWidth: 60,
  },
});

export default GeofenceTracker;

function geofenceAreaRequest(geofenceData: GeofenceData): any {
  throw new Error('Function not implemented.');
}


function connectionrequest() {
  throw new Error('Function not implemented.');
}
