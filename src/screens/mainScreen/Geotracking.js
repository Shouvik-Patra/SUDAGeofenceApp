import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  PermissionsAndroid,
  Platform,
  ImageBackground,
  Dimensions,
  Modal,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Header from '../../components/Header';
import connectionrequest from '../../utils/helpers/NetInfo';
import { useDispatch, useSelector } from 'react-redux';
import { createParkGeofenceRequest } from '../../redux/reducer/ProfileReducer';
import showErrorAlert from '../../utils/helpers/Toast';
import { Images } from '../../themes/ThemePath';

const { width } = Dimensions.get('window');
let status = '';

const Geotracking = props => {
  const AuthReducer = useSelector(state => state.AuthReducer);
  const ProfileReducer = useSelector(state => state.ProfileReducer);

  // Props from previous page
  const {
    park_details_id,
    district_id,
    municipality_id,
    park_name,
    description,
  } = props?.route?.params || {};

  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const [isTracking, setIsTracking] = useState(false);
  const [coordinates, setCoordinates] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [initialLocation, setInitialLocation] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
    getCurrentLocationOnLoad();
    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (coordinates.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [coordinates]);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for geofencing',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Location permission is required for geofencing',
          );
        }
      } else {
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  const getCurrentLocationOnLoad = () => {
    setLoadingLocation(true);
    Geolocation.getCurrentPosition(
      position => {
        const { latitude: lat, longitude: lng } = position.coords;
        const location = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        };
        setCurrentLocation(location);
        setInitialLocation(location);
        setLoadingLocation(false);
        console.log('Current location loaded:', location);
        
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...location,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 1000);
        }
      },
      error => {
        console.error('Failed to get current location:', error);
        setLoadingLocation(false);
        const fallbackLocation = {
          latitude: 37.78825,
          longitude: -122.4324,
        };
        setInitialLocation(fallbackLocation);
        setCurrentLocation(fallbackLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const handleGetCurrentLocation = () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant location permission first',
      );
      return;
    }
    
    setLoadingLocation(true);
    Geolocation.getCurrentPosition(
      position => {
        const { latitude: lat, longitude: lng } = position.coords;
        const location = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        };
        setCurrentLocation(location);
        setLoadingLocation(false);
        
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...location,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 1000);
        }
        
        Alert.alert(
          'Location Updated',
          `Lat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}`,
        );
      },
      error => {
        console.error('Location error:', error);
        setLoadingLocation(false);
        Alert.alert('Error', 'Failed to get current location: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const startTracking = () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant location permission first',
      );
      return;
    }

    try {
      setIsTracking(true);
      setCoordinates([]);
      setElapsedTime(0);
      startTimeRef.current = Date.now();

      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(
            Math.floor((Date.now() - startTimeRef.current) / 1000),
          );
        }
      }, 1000);

      Geolocation.getCurrentPosition(
        position => {
          const { latitude: lat, longitude: lng } = position.coords;
          const newCoord = { 
            latitude: parseFloat(lat), 
            longitude: parseFloat(lng) 
          };
          setCoordinates([newCoord]);
          console.log('Initial position:', newCoord);
        },
        error => {
          console.error('Initial location error:', error);
          Alert.alert('Error', 'Failed to get initial location: ' + error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );

      watchIdRef.current = Geolocation.watchPosition(
        position => {
          const { latitude: lat, longitude: lng } = position.coords;
          const newCoord = { 
            latitude: parseFloat(lat), 
            longitude: parseFloat(lng) 
          };
          
          console.log('New position:', newCoord);
          
          setCoordinates(prev => {
            const lastCoord = prev[prev.length - 1];
            if (lastCoord && 
                Math.abs(lastCoord.latitude - newCoord.latitude) < 0.000001 &&
                Math.abs(lastCoord.longitude - newCoord.longitude) < 0.000001) {
              return prev;
            }
            return [...prev, newCoord];
          });
        },
        error => {
          console.error('Location error:', error);
          Alert.alert('Error', 'Failed to get location: ' + error.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 1, 
          interval: 2000, 
          fastestInterval: 1000,
          useSignificantChanges: false,
        },
      );
    } catch (error) {
      console.error('Tracking error:', error);
      Alert.alert('Error', 'Failed to start tracking');
      setIsTracking(false);
    }
  };

  const endTracking = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsTracking(false);
    
    if (coordinates.length >= 3) {
      setShowSaveModal(true);
    }
  };

  const stopTracking = () => {
    endTracking();
  };

  const handleCancel = () => {
    setShowSaveModal(false);
    setCoordinates([]);
    setElapsedTime(0);
    startTimeRef.current = null;
  };

  const handleSaveFromModal = () => {
    setShowSaveModal(false);
    handleSave();
  };

  const formatTime = seconds => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(
      2,
      '0',
    )}:${String(secs).padStart(2, '0')}`;
  };

  const generatePolygonString = coords => {
    if (coords.length < 3) {
      return '';
    }

    const polygonCoords = [...coords, coords[0]];
    const coordString = polygonCoords
      .map(coord => `${parseFloat(coord.longitude).toFixed(8)} ${parseFloat(coord.latitude).toFixed(8)}`)
      .join(', ');

    return `POLYGON((${coordString}))`;
  };

  // Calculate the centroid (center point) of the polygon
  const calculateCentroid = coords => {
    if (coords.length === 0) {
      return { latitude: 0, longitude: 0 };
    }

    let sumLat = 0;
    let sumLng = 0;

    coords.forEach(coord => {
      sumLat += coord.latitude;
      sumLng += coord.longitude;
    });

    return {
      latitude: sumLat / coords.length,
      longitude: sumLng / coords.length,
    };
  };

  // Calculate distance between two coordinates using Haversine formula (in meters)
  const calculateDistance = (coord1, coord2) => {
    const R = 6371000; // Earth's radius in meters
    const lat1 = coord1.latitude * (Math.PI / 180);
    const lat2 = coord2.latitude * (Math.PI / 180);
    const deltaLat = (coord2.latitude - coord1.latitude) * (Math.PI / 180);
    const deltaLng = (coord2.longitude - coord1.longitude) * (Math.PI / 180);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate the maximum distance from centroid to any coordinate (radius)
  const calculateRadius = (coords, centroid) => {
    if (coords.length === 0) {
      return 0;
    }

    let maxDistance = 0;

    coords.forEach(coord => {
      const distance = calculateDistance(centroid, coord);
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    });

    // Round to nearest meter and add 10% buffer
    return Math.ceil(maxDistance * 1.1);
  };

  const handleSave = () => {
    if (coordinates.length < 3) {
      Alert.alert(
        'Insufficient Coordinates',
        'At least 3 coordinates are required to create a polygon',
      );
      return;
    }

    // Calculate centroid (center point)
    const centroid = calculateCentroid(coordinates);
    
    // Calculate radius (max distance from center)
    const radius = calculateRadius(coordinates, centroid);
    
    // Generate polygon string
    const geofencePolygon = generatePolygonString(coordinates);

    const payload = {
      park_details_id,
      district_id,
      municipality_id,
      park_name,
      description,
      latitude: parseFloat(centroid.latitude.toFixed(8)),
      longitude: parseFloat(centroid.longitude.toFixed(8)),
      radius_meters: radius,
      geofence_polygon: geofencePolygon,
      geofence_type: 'polygon',
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Total coordinates collected:', coordinates.length);
    console.log('Calculated Centroid:', centroid);
    console.log('Calculated Radius (meters):', radius);
    
    connectionrequest()
      .then(() => {
        dispatch(createParkGeofenceRequest(payload));
      })
      .catch(err => {
        console.log(err);
        showErrorAlert('Please connect to internet');
      });
  };

  if (status == '' || ProfileReducer.status != status) {
    switch (ProfileReducer.status) {
      case 'Profile/createParkGeofenceRequest':
        status = ProfileReducer.status;
        break;
      case 'Profile/createParkGeofenceSuccess':
        status = ProfileReducer.status;
        props.navigation.goBack();
        break;
      case 'Profile/createParkGeofenceFailure':
        status = ProfileReducer.status;
        break;
    }
  }

  return (
    <ImageBackground
      source={Images.appBG}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <Header
        HeaderLogo
        Title
        placeText={'Geo Fencing'}
        onPress_back_button={() => {}}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Geofence Tracking</Text>
          <Text style={styles.subtitle}>{park_name || 'Park Name'}</Text>
          {currentLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 Current: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: initialLocation?.latitude || 37.78825,
              longitude: initialLocation?.longitude || -122.4324,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={isTracking}
          >
            {/* Starting point marker */}
            {coordinates.length > 0 && (
              <Marker
                coordinate={coordinates[0]}
                title="Start"
                pinColor="green"
              />
            )}

            {/* Current location marker (last coordinate) */}
            {coordinates.length > 0 && (
              <Marker
                coordinate={coordinates[coordinates.length - 1]}
                title="Current Location"
                pinColor="red"
              />
            )}

            {/* Draw the tracking path */}
            {coordinates.length > 1 && (
              <Polyline
                coordinates={coordinates}
                strokeColor="#2196F3"
                strokeWidth={4}
                lineDashPattern={[1]}
              />
            )}

            {/* Draw polygon preview when tracking stops */}
            {!isTracking && coordinates.length >= 3 && (
              <Polyline
                coordinates={[...coordinates, coordinates[0]]}
                strokeColor="#4CAF50"
                strokeWidth={3}
                fillColor="rgba(76, 175, 80, 0.2)"
              />
            )}
          </MapView>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Elapsed Time</Text>
            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Coordinates</Text>
            <Text style={styles.statValue}>{coordinates.length}</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: isTracking ? '#4CAF50' : '#9E9E9E' },
            ]}
          />
          <Text style={styles.statusText}>
            {isTracking ? 'Tracking Active' : 'Tracking Stopped'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {!isTracking ? (
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={startTracking}
              disabled={!hasPermission}
            >
              <Text style={styles.buttonText}>Start Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopTracking}
            >
              <Text style={styles.buttonText}>End Tracking</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Save/Cancel Modal */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Geofence?</Text>
            <Text style={styles.modalText}>
              You have collected {coordinates.length} coordinates.{'\n'}
              Do you want to save this geofence?
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSaveFromModal}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

export default Geotracking;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  locationInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  mapContainer: {
    height: 300,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 100,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#757575',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});