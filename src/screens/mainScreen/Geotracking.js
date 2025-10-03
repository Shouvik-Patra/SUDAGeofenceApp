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
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import Header from '../../components/Header';
import connectionrequest from '../../utils/helpers/NetInfo';
import { useDispatch, useSelector } from 'react-redux';
import { createParkGeofenceRequest } from '../../redux/reducer/ProfileReducer';
import showErrorAlert from '../../utils/helpers/Toast';
import { Images } from '../../themes/ThemePath';
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
    latitude,
    longitude,
    radius_meters,
  } = props?.route?.params || {};
  const dispatch = useDispatch();
  const [isTracking, setIsTracking] = useState(false);
  const [coordinates, setCoordinates] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);

  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
    return () => {
      stopTracking();
    };
  }, []);

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
        // iOS permissions are handled via Info.plist
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to request location permission');
    }
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

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(
            Math.floor((Date.now() - startTimeRef.current) / 1000),
          );
        }
      }, 1000);

      // Start location tracking
      watchIdRef.current = Geolocation.watchPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setCoordinates(prev => [...prev, { latitude, longitude }]);
        },
        error => {
          console.error('Location error:', error);
          Alert.alert('Error', 'Failed to get location: ' + error.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 1, // Update every 1 meter
          interval: 2000, // Android: Update every 2 seconds
          fastestInterval: 1000, // Android: Fastest update rate
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
  };

  const stopTracking = () => {
    endTracking();
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

    // Close the polygon by adding the first coordinate at the end
    const polygonCoords = [...coords, coords[0]];
    const coordString = polygonCoords
      .map(coord => `${coord.longitude} ${coord.latitude}`)
      .join(', ');

    return `POLYGON((${coordString}))`;
  };

  const handleSave = () => {
    if (coordinates.length < 2) {
      Alert.alert(
        'Insufficient Coordinates',
        'At least 3 coordinates are required to create a polygon',
      );
      return;
    }

    const geofencePolygon = generatePolygonString(coordinates);

    const payload = {
      park_details_id,
      district_id,
      municipality_id,
      park_name,
      description,
      latitude,
      longitude,
      radius_meters,
      geofence_polygon: geofencePolygon,
      geofence_type: 'polygon',
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    connectionrequest()
      .then(() => {
        dispatch(createParkGeofenceRequest(payload));
      })
      .catch(err => {
        console.log(err);
        showErrorAlert('Please connect to internet');
      });
    // Alert.alert(
    //   'Geofence Created',
    //   `Coordinates: ${coordinates.length}\nTime: ${formatTime(elapsedTime)}`,
    //   [
    //     {
    //       text: 'OK',
    //       onPress: () => {
    //         // You can call your API here or navigate back
    //         // Example: await saveGeofence(payload);
    //         // navigation.goBack();
    //       },
    //     },
    //   ],
    // );
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

        <ScrollView style={styles.coordinatesList}>
          <Text style={styles.coordinatesTitle}>Recent Coordinates:</Text>
          {coordinates
            .slice(-5)
            .reverse()
            .map((coord, index) => (
              <View key={index} style={styles.coordinateItem}>
                <Text style={styles.coordinateText}>
                  {coordinates.length - index}. Lat: {coord.latitude.toFixed(6)}
                  , Lng: {coord.longitude.toFixed(6)}
                </Text>
              </View>
            ))}
          {coordinates.length === 0 && (
            <Text style={styles.noDataText}>
              Start tracking to collect coordinates
            </Text>
          )}
        </ScrollView>

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

          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              coordinates.length < 3 && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={coordinates.length < 3}
          >
            <Text style={styles.buttonText}>Save Geofence</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default Geotracking;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#F5F5F5',
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
  coordinatesList: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  coordinatesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  coordinateItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  coordinateText: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  buttonContainer: {
    gap: 10,
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
  saveButton: {
    backgroundColor: '#2196F3',
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
