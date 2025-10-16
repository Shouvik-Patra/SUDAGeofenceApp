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
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Geolocation from '@react-native-community/geolocation';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import MapView, { Polyline, Marker, Circle, Region } from 'react-native-maps';
import CustomHeader from '@app/components/CustomHeader';
import { Colors, Fonts, Images } from '@app/themes';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, store, useAppDispatch, useAppSelector } from '@app/store';
import { useIsFocused } from '@react-navigation/native';
import { assignedParkRequest } from '@app/store/slice/user.slice';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface ApiGeofenceData {
  district_id: number;
  municipality_id: number;
  park_name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  geofence_polygon: string;
  geofence_type: string;
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

const GeofenceTracker: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { user,loading, error } = useAppSelector(state => state.auth);
  
  // Get the navigation parameters
  const { newRegion } = route.params || {};

  // State definitions with proper types
  const [selectedType, setSelectedType] = useState<LocationType | ''>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<StepType>('map');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [coordinates, setCoordinates] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [submittedData, setSubmittedData] = useState<GeofenceData | null>(null);
  console.log("submittedData>>>",submittedData);
  
  const [showDataModal, setShowDataModal] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mapRegion, setMapRegion] = useState<Region>(
    newRegion || {
      latitude: 22.5726,
      longitude: 88.3639,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
  );
  const [pathStats, setPathStats] = useState<PathStats>({
    distance: 0,
    avgSpeed: 0,
    maxSpeed: 0,
  });

  // Refs with proper types
  const timerRef = useRef<number | null>(null);
  const watchId = useRef<number | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (isFocused) {
      getAssignedParkInfo();
    }
  }, [isFocused]);

  // Effect to handle navigation parameters
  useEffect(() => {
    if (newRegion) {
      console.log('Received newRegion from navigation:', newRegion);
      setMapRegion(newRegion);
      
      // If map ref is available, animate to the new region
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
      
      // Optionally set the current location based on the new region
      setCurrentLocation({
        lat: newRegion.latitude,
        lng: newRegion.longitude,
        timestamp: Date.now(),
      });
    }
  }, [newRegion]);

  const getAssignedParkInfo = async () => {
    try {
      dispatch(assignedParkRequest());
    } catch (error) {
      console.log('Error in fetching posts', error);
    }
  };

  // Function to handle back navigation
  const handleBackPress = (): void => {
    if (currentStep === 'selection') {
      // Navigate to previous screen or exit app
      Alert.alert('Exit', 'Do you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          onPress: () => {
            navigation?.goBack();
          },
        },
      ]);
    } else {
      resetToSelection();
    }
  };

  // Calculate distance between two points
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Update path statistics
  const updatePathStats = (newCoords: Location[]): void => {
    if (newCoords.length < 2) return;

    let totalDistance = 0;
    let maxSpeed = 0;

    for (let i = 1; i < newCoords.length; i++) {
      const distance = calculateDistance(
        newCoords[i - 1].lat,
        newCoords[i - 1].lng,
        newCoords[i].lat,
        newCoords[i].lng,
      );
      totalDistance += distance;

      if (newCoords[i].timestamp && newCoords[i - 1].timestamp) {
        const timeDiff =
          (newCoords[i].timestamp! - newCoords[i - 1].timestamp!) / 1000;
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
      maxSpeed: maxSpeed,
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
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // Start walking/tracking
  const startWalking = (): void => {
    setIsTracking(true);
    setTimer(0);
    setCoordinates([]);
    setPathStats({ distance: 0, avgSpeed: 0, maxSpeed: 0 });
    setCurrentStep('tracking');

    watchId.current = Geolocation.watchPosition(
      (position: {
        coords: { latitude: any; longitude: any; accuracy: any; speed: any };
      }) => {
        const newCoord: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
        };

        setCurrentLocation(newCoord);
        setCoordinates(prev => [...prev, newCoord]);
      },
      (error: any) => {
        console.error('Error getting location:', error);
        Alert.alert(
          'Location Error',
          'Error getting location. Please check your location settings.',
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
        distanceFilter: 1,
        interval: 1000,
      },
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

  // Create polygon string from coordinates - FIXED VERSION
  const createPolygonString = (coords: Location[]): string => {
    console.log('Creating polygon with coords:', coords.length);
    
    if (coords.length === 0) {
      console.log('No coordinates available, using default polygon');
      // Return default polygon if no coordinates
      return 'POLYGON((88.3639 22.5726, 88.3645 22.5728, 88.3648 22.5722, 88.3639 22.5726))';
    }

    if (coords.length === 1) {
      console.log('Single coordinate, creating small square polygon');
      // Create a small square around the single point
      const lat = coords[0].lat;
      const lng = coords[0].lng;
      const offset = 0.0001; // Small offset for square
      return `POLYGON((${lng} ${lat}, ${lng + offset} ${lat}, ${lng + offset} ${lat + offset}, ${lng} ${lat + offset}, ${lng} ${lat}))`;
    }

    if (coords.length === 2) {
      console.log('Two coordinates, creating rectangle polygon');
      // Create a rectangle from two points
      const lat1 = coords[0].lat;
      const lng1 = coords[0].lng;
      const lat2 = coords[1].lat;
      const lng2 = coords[1].lng;
      const minLat = Math.min(lat1, lat2);
      const maxLat = Math.max(lat1, lat2);
      const minLng = Math.min(lng1, lng2);
      const maxLng = Math.max(lng1, lng2);
      
      return `POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`;
    }

    // For 3 or more coordinates, create proper polygon
    console.log('Multiple coordinates, creating proper polygon');
    
    // Filter out duplicate consecutive points to avoid invalid polygons
    const filteredCoords = coords.filter((coord, index) => {
      if (index === 0) return true;
      const prev = coords[index - 1];
      const distance = calculateDistance(prev.lat, prev.lng, coord.lat, coord.lng);
      return distance > 1; // Only include points that are at least 1 meter apart
    });

    if (filteredCoords.length < 3) {
      console.log('After filtering, less than 3 coordinates, using fallback');
      // Fallback to default if filtering removes too many points
      return 'POLYGON((88.3639 22.5726, 88.3645 22.5728, 88.3648 22.5722, 88.3639 22.5726))';
    }

    // Create polygon coordinates string
    const polygonCoords = filteredCoords
      .map(coord => `${coord.lng.toFixed(6)} ${coord.lat.toFixed(6)}`)
      .join(', ');
    
    // Close the polygon by adding the first coordinate at the end
    const firstCoord = filteredCoords[0];
    const polygonString = `POLYGON((${polygonCoords}, ${firstCoord.lng.toFixed(6)} ${firstCoord.lat.toFixed(6)}))`;
    
    console.log('Generated polygon string:', polygonString);
    return polygonString;
  };

  // Calculate approximate radius from coordinates - IMPROVED VERSION
  const calculateRadius = (coords: Location[]): number => {
    if (coords.length === 0) {
      console.log('No coordinates for radius calculation, using default');
      return 200; // Default radius
    }
    
    if (coords.length === 1) {
      console.log('Single coordinate for radius, using default');
      return 50; // Small default radius for single point
    }

    // Calculate centroid of all coordinates
    const centroid = {
      lat: coords.reduce((sum, coord) => sum + coord.lat, 0) / coords.length,
      lng: coords.reduce((sum, coord) => sum + coord.lng, 0) / coords.length,
    };

    // Find maximum distance from centroid to any point
    let maxDistance = 0;
    coords.forEach(coord => {
      const distance = calculateDistance(
        centroid.lat,
        centroid.lng,
        coord.lat,
        coord.lng,
      );
      maxDistance = Math.max(maxDistance, distance);
    });

    // Ensure minimum radius of 10 meters
    const radius = Math.max(Math.round(maxDistance), 10);
    console.log('Calculated radius:', radius);
    return radius;
  };

  // Get authorization token from AsyncStorage
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  };

  // API call to create park geofence - IMPROVED VERSION
  const createParkGeofenceAPI = async (
    data: ApiGeofenceData,
  ): Promise<boolean> => {
    try {
      const { token } = store.getState().auth;

      if (!token) {
        Alert.alert(
          'Authentication Error',
          'No authorization token found. Please login again.',
        );
        return false;
      }

      console.log("Final payload data being sent:", JSON.stringify(data, null, 2));

      // Validate payload before sending
      if (!data.geofence_polygon || data.geofence_polygon.trim() === '') {
        console.error('Empty geofence_polygon detected!');
        Alert.alert(
          'Data Error',
          'Unable to create geofence polygon. Please try tracking again.',
        );
        return false;
      }

      const response = await fetch(
        'http://3.108.65.168/v1/api/createParkGeofence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        },
      );

      const responseData = await response.json();
      console.log('createParkGeofence response status:', response.status);
      console.log('createParkGeofence response data:', responseData);

      if (response.ok) {
        console.log('API Success:', responseData);
        Alert.alert(
          'Success',
          'Geofence data has been successfully submitted!',
          [{ text: 'OK' }],
        );
        return true;
      } else {
        console.error('API Error:', responseData);
        Alert.alert(
          'Submission Failed',
          responseData.message ||
            'Failed to submit geofence data. Please try again.',
          [{ text: 'OK' }],
        );
        return false;
      }
    } catch (error) {
      console.error('Network Error:', error);
      Alert.alert(
        'Network Error',
        'Unable to connect to the server. Please check your internet connection and try again.',
        [{ text: 'OK' }],
      );
      return false;
    }
  };

  // Submit geofence data - IMPROVED VERSION
  const submitData = async (): Promise<void> => {
    console.log('Starting submitData with coordinates count:', coordinates.length);
    console.log('Current location:', currentLocation);

    if (!currentLocation) {
      Alert.alert(
        'No Location Data',
        'No current location available. Please ensure location services are enabled and try again.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate center point (use current location if no coordinates, or centroid if multiple)
      let centerLat = currentLocation.lat;
      let centerLng = currentLocation.lng;

      if (coordinates.length > 0) {
        centerLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
        centerLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0) / coordinates.length;
      }

      // Prepare API data with improved polygon generation
      const polygon = createPolygonString(coordinates);
      const radius = calculateRadius(coordinates);

      const apiData: ApiGeofenceData = {
        district_id: u,
        municipality_id: 139,
        park_name: selectedName || "Default Park Name",
        description: `Geofenced area for ${selectedName || "Default Park"}`,
        latitude: parseFloat(centerLat.toFixed(6)),
        longitude: parseFloat(centerLng.toFixed(6)),
        radius_meters: radius,
        geofence_polygon: polygon,
        geofence_type: 'polygon',
      };

      console.log('Prepared API data:', apiData);

      // Validate data before API call
      if (!apiData.geofence_polygon || apiData.geofence_polygon.trim() === '') {
        throw new Error('Failed to generate valid geofence polygon');
      }

      // Call API
      const success = await createParkGeofenceAPI(apiData);
      console.log("API call success:", success);

      if (success) {
        // Prepare local data for display
        const dynamicPropertyName = `${selectedType
          .toLowerCase()
          .replace(' ', '_')}_name`;
        const geofenceData: GeofenceData = {
          district_id: 24,
          municipality_id: 139,
          [dynamicPropertyName]: selectedName || "Default Park Name",
          description: `Geofenced area for ${selectedName || "Default Park"}`,
          latitude: centerLat,
          longitude: centerLng,
          radius_meters: radius,
          geofence_polygon: polygon,
          geofence_type: 'polygon',
          tracking_duration_seconds: timer,
          coordinates_count: coordinates.length,
          total_distance_meters: Math.round(pathStats.distance),
          average_speed_ms: pathStats.avgSpeed.toFixed(2),
          max_speed_ms: pathStats.maxSpeed.toFixed(2),
          created_at: new Date().toISOString(),
        };

        setSubmittedData(geofenceData);
        setShowDataModal(true);

        // Reset form after successful submission
        setTimeout(() => {
          setSelectedType('');
          setSelectedName('');
          setTimer(0);
          setCoordinates([]);
          setCurrentLocation(null);
          setPathStats({ distance: 0, avgSpeed: 0, maxSpeed: 0 });
          setCurrentStep('selection');
        }, 2000);
      }
    } catch (error) {
      console.error('Submit Error:', error);
      Alert.alert('Error', `An error occurred. Please try again.`, [
        { text: 'OK' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert coordinates for polyline
  const getPolylineCoordinates = (): MapCoordinate[] => {
    return coordinates.map(coord => ({
      latitude: coord.lat,
      longitude: coord.lng,
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

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={Images.greenbg} style={{ flex: 1 }}>
        {/* Map Header */}
        <CustomHeader
          title={`${selectedType}: ${selectedName}`}
          onBackPress={handleBackPress}
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
                  longitude: coordinates[0].lng,
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
                  longitude: currentLocation.lng,
                }}
                title={isTracking ? 'Current Position' : 'End Point'}
                pinColor={isTracking ? 'blue' : 'red'}
              />
            )}

            {/* Geofence Circle */}
            {currentStep === 'completed' && coordinates.length > 0 && (
              <Circle
                center={{
                  latitude: coordinates[0].lat,
                  longitude: coordinates[0].lng,
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
              <Text style={styles.mapInfoText}>Timer: {formatTime(timer)}</Text>
              <Text style={styles.mapInfoText}>
                Points: {coordinates.length}
              </Text>
              {coordinates.length > 1 && (
                <Text style={styles.mapInfoText}>
                  Distance: {pathStats.distance.toFixed(0)}m
                </Text>
              )}
              {currentStep === 'completed' && coordinates.length >= 0 && (
                <Text style={styles.mapInfoText}>
                  Radius: {calculateRadius(coordinates)}m
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Map Bottom Controls */}
        <View style={styles.mapBottomControls}>
          {/* Status Banner */}
          <View style={styles.statusBanner}>
            {currentStep === 'map' && (
              <Text style={styles.statusText}>
                📍 Ready to start walking. Tap "Start Walking" to begin
                tracking.
              </Text>
            )}
            {currentStep === 'tracking' && (
              <Text style={styles.statusText}>
                🚶‍♂️ Walking... Your path is being tracked on the map!
              </Text>
            )}
            {currentStep === 'completed' && (
              <Text style={styles.statusText}>
                ✅ Walking completed! Review your path and submit the data.
              </Text>
            )}
          </View>
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
                style={[
                  styles.button,
                  styles.submitButton,
                  styles.flexButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={submitData}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                      Submitting...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>📤 Submit Data</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.resetButton, styles.flexButton]}
                onPress={resetToSelection}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>🔄 New Track</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: Fonts.MulishSemiBold,
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
    marginBottom: 15,
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
    position: 'absolute',
    bottom: 25,
    width: '100%',
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
