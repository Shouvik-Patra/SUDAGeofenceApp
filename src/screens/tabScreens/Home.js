import {
  Alert,
  Image,
  ImageBackground,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { Colors, Fonts, Images } from '../../themes/ThemePath';
import showErrorAlert from '../../utils/helpers/Toast';
import { Camera } from 'react-native-vision-camera';
import normalize from '../../utils/helpers/normalize';
import moment from 'moment';
import Modal from 'react-native-modal';
import Geolocation from '@react-native-community/geolocation';
import Loader from '../../utils/helpers/Loader';
import connectionrequest from '../../utils/helpers/NetInfo';
import {
  attendenceStatusRequest,
  userDetailsRequest,
} from '../../redux/reducer/ProfileReducer';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import constants from '../../utils/helpers/constants';
import UpdateModal from '../../components/UpdateModal';

let status = '';

const Home = props => {
  const dispatch = useDispatch();
  const AuthReducer = useSelector(state => state.AuthReducer);
  const ProfileReducer = useSelector(state => state.ProfileReducer);
  console.log('image>>>>>>>>', ProfileReducer?.userDetailsResponse?.photo);

  const isFocused = useIsFocused();
  const [addTaskModal, setAddTaskModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  // Permission states
  const [locationPermission, setLocationPermission] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);

  const [location, setLocation] = useState({
    latitude: 22.5726,
    longitude: 88.3639,
  });

  useEffect(() => {
    const checkPermission = async () => {
      const status = await Camera.getCameraPermissionStatus();

      if (status !== 'authorized') {
        const newStatus = await Camera.requestCameraPermission();
      }
    };

    checkPermission();
  }, [isFocused]);

  useEffect(() => {
    if (ProfileReducer?.userDetailsResponse?.app_info != undefined) {
      if (
        ProfileReducer?.userDetailsResponse?.app_info[0]?.value !=
        constants?.APP_VERSION
      ) {
        setUpdateModalVisible(true);
      }
    }
  }, [isFocused]);

  // Check and request location permission
  const checkLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (granted) {
          setLocationPermission('granted');
          return true;
        } else {
          const requestResult = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission Required',
              message:
                'This app needs access to your location for attendance marking.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );

          if (requestResult === PermissionsAndroid.RESULTS.GRANTED) {
            setLocationPermission('granted');
            return true;
          } else if (
            requestResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
          ) {
            setLocationPermission('denied');
            showSettingsAlert('Location');
            return false;
          } else {
            setLocationPermission('denied');
            return false;
          }
        }
      } catch (error) {
        console.log('Location permission error:', error);
        setLocationPermission('denied');
        return false;
      }
    } else {
      // For iOS, you might need to check differently
      setLocationPermission('granted');
      return true;
    }
  };

  // Check and request camera permission
  const checkCameraPermission = async () => {
    try {
      const permission = await Camera.getCameraPermissionStatus();

      if (permission === 'granted') {
        setCameraPermission('granted');
        return true;
      } else if (permission === 'not-determined') {
        const newPermission = await Camera.requestCameraPermission();
        if (newPermission === 'granted') {
          setCameraPermission('granted');
          return true;
        } else {
          setCameraPermission('denied');
          if (newPermission === 'denied') {
            showSettingsAlert('Camera');
          }
          return false;
        }
      } else {
        setCameraPermission('denied');
        showSettingsAlert('Camera');
        return false;
      }
    } catch (error) {
      console.log('Camera permission error:', error);
      setCameraPermission('denied');
      return false;
    }
  };

  // Show alert to navigate to settings
  const showSettingsAlert = permissionType => {
    Alert.alert(
      `${permissionType} Permission Required`,
      `Please enable ${permissionType.toLowerCase()} permission in settings to use this feature.`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Permission denied'),
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ],
    );
  };

  const getLocation = async (isInside, attendenceStatus) => {
    setAddTaskModal(false);
    try {
      setLoading(true);
      setLoadingMessage('Checking permissions...');

      const locationGranted = await checkLocationPermission();
      const cameraGranted = await checkCameraPermission();

      if (!locationGranted) {
        setLoading(false);
        setLoadingMessage('');
        showErrorAlert(
          'Location permission is required for attendance marking',
        );
        return;
      }

      if (!cameraGranted) {
        setLoading(false);
        setLoadingMessage('');
        showErrorAlert('Camera permission is required for attendance marking');
        return;
      }

      // Start location fetching
      setLoadingMessage('Fetching your location...');

      const locationPromise = new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            resolve({ latitude, longitude });
          },
          error => {
            console.log('Geolocation error:', error);
            let errorMessage = 'Unable to fetch location. ';

            switch (error.code) {
              case 1:
                errorMessage += 'Location permission denied.';
                break;
              case 2:
                errorMessage += 'Location not available.';
                break;
              case 3:
                errorMessage += 'Location request timed out.';
                break;
              default:
                errorMessage += 'Please try again.';
            }

            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 10000,
          },
        );
      });

      // Wait for location
      const locationData = await locationPromise;
      setLocation(locationData);

      // Navigate to Attendence without geocoding
      setLoading(false);
      setLoadingMessage('');
      setAddTaskModal(false);

      props?.navigation.navigate('Attendence', {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        pagename: 'Home',
        isInsideOffice: isInside,
        attendenceStatus: attendenceStatus,
        status:
          ProfileReducer?.attendenceStatusResponse?.is_attendance_given == 1 ||
          ProfileReducer?.attendenceStatusResponse?.is_attendance_given == 2 ||
          ProfileReducer?.attendenceStatusResponse?.is_attendance_given == 3
            ? 'clockout'
            : 'clockin',
        check_out_remarks:
          ProfileReducer?.attendenceStatusResponse?.task_tracking_remarks,
      });
    } catch (error) {
      setLoading(false);
      setLoadingMessage('');
      console.log('Location fetch error:', error);
      showErrorAlert(
        error.message || 'Failed to get location. Please try again.',
      );
    }
  };

  // Initial permission check on component mount
  useEffect(() => {
    const initializePermissions = async () => {
      await checkLocationPermission();
      await checkCameraPermission();
    };

    initializePermissions();
  }, []);

  useEffect(() => {
    if (isFocused) {
      connectionrequest()
        .then(() => {
          dispatch(attendenceStatusRequest());
          dispatch(userDetailsRequest());
        })
        .catch(err => {
          console.log(err);
          showErrorAlert('Please connect to internet');
        });
    } else {
      setAddTaskModal(false);
    }
  }, [isFocused]);

  // Handle clock in/out button press with permission validation
  const handleClockAction = () => {
    // Check permissions before proceeding
    if (locationPermission !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Please grant location permission to mark attendance.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Grant Permission',
            onPress: () => checkLocationPermission(),
          },
        ],
      );
      return;
    }

    if (cameraPermission !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to mark attendance.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Grant Permission',
            onPress: () => checkCameraPermission(),
          },
        ],
      );
      return;
    }

    const { status, is_attendance_given, is_task_running } =
      ProfileReducer?.attendenceStatusResponse || {};

    if (status === 'present') {
      if (is_task_running) {
        Alert.alert('Warning!', 'Please End the running task', [
          {
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: () => {
              props?.navigation?.navigate('DailyTask', {
                currenLocation: 'Home',
              });
            },
          },
        ]);
      } else {
        getLocation('inside', 'present');
      }
    } else {
      // Alert.alert("Helllo")
      getLocation('inside', 'present');
    }
  };

  if (status == '' || ProfileReducer.status != status) {
    switch (ProfileReducer.status) {
      case 'Profile/userDetailsRequest':
        status = ProfileReducer.status;
        break;
      case 'Profile/userDetailsSuccess':
        status = ProfileReducer.status;
        break;
      case 'Profile/userDetailsFailure':
        status = ProfileReducer.status;
        break;
      case 'Profile/attendenceStatusRequest':
        status = ProfileReducer.status;
        break;
      case 'Profile/attendenceStatusSuccess':
        status = ProfileReducer.status;
        break;
      case 'Profile/attendenceStatusFailure':
        status = ProfileReducer.status;
        break;
    }
  }

  return (
    <View style={styles.mainContainer}>
      <Header
        HeaderLogo
        Title
        placeText={'Home'}
        onPress_back_button={() => {
          // setModalVisible(true);
        }}
        onPress_right_button={() => {
          props.navigation.navigate('Notification');
        }}
      />

      <Loader
        visible={
          loading ||
          ProfileReducer?.status == 'Profile/clockinRequest' ||
          ProfileReducer?.status == 'Profile/userDetailsRequest'
        }
        loadingText={loadingMessage || 'Loading...'}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section */}
        <View style={styles.userInfoContainer}>
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>
              {ProfileReducer?.userDetailsResponse?.name}
            </Text>
            <Text style={styles.phone}>
              {ProfileReducer?.userDetailsResponse?.phone}
            </Text>
            <Text
              style={[
                styles.userAddress,
                { color: Colors.orange, textTransform: 'capitalize' },
              ]}
            >
              {[
                ProfileReducer?.userDetailsResponse?.municipality,
                ...(
                  ProfileReducer?.userDetailsResponse?.municipality_another ||
                  []
                ).map(item => item?.name),
              ]
                .filter(Boolean)
                .join(', ')}
            </Text>

            <Text style={styles.blackText}>
              Designation :{' '}
              <Text
                style={[
                  styles.redText,
                  {
                    color: Colors.black,
                    fontFamily: Fonts.MulishMedium,
                  },
                ]}
              >
                {ProfileReducer?.userDetailsResponse?.designation}
              </Text>
            </Text>
            <Text style={styles.blackText}>
              Attendance:{' '}
              <Text
                style={[
                  styles.redText,
                  {
                    color:
                      ProfileReducer?.attendenceStatusResponse?.status ===
                      'pending'
                        ? Colors.red
                        : Colors.green,
                  },
                ]}
              >
                {ProfileReducer?.attendenceStatusResponse
                  ?.attendance_status_text === 'Clocked Out Other' ||
                ProfileReducer?.attendenceStatusResponse
                  ?.attendance_status_text === 'Clocked Out Outside' ||
                ProfileReducer?.attendenceStatusResponse
                  ?.attendance_status_text === 'Clocked Out Inside'
                  ? 'Clocked Out'
                  : ProfileReducer?.attendenceStatusResponse?.status ===
                    'pending'
                  ? 'Pending...'
                  : 'Clocked In'}
              </Text>
            </Text>

            <Text style={styles.blackText}>
              Today :
              <Text style={styles.todayText}>
                {' '}
                {moment().format('ddd, MMM, D')}.
              </Text>
            </Text>

            {/* Permission Status Indicators */}
            {(locationPermission === 'denied' ||
              cameraPermission === 'denied') && (
              <View style={styles.permissionWarning}>
                <Text style={styles.permissionWarningText}>
                  ⚠️ Permissions needed for attendance marking
                </Text>
                {locationPermission === 'denied' && (
                  <Text style={styles.permissionText}>
                    • Location access required
                  </Text>
                )}
                {cameraPermission === 'denied' && (
                  <Text style={styles.permissionText}>
                    • Camera access required
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.imageContainer}>
            {ProfileReducer?.userDetailsResponse?.photo ? (
              <Image
                resizeMode="cover"
                style={styles.userImage}
                source={{
                  uri: ProfileReducer?.userDetailsResponse?.photo,
                }}
              />
            ) : (
              <Image
                resizeMode="contain"
                style={styles.userImagePlaceholder}
                source={Images.profilepic}
              />
            )}
          </View>
        </View>

        {/* Clock In/Out Button */}
        {!(
          ProfileReducer?.attendenceStatusResponse?.attendance_status_text ===
            'Clocked Out Outside' ||
          ProfileReducer?.attendenceStatusResponse?.attendance_status_text ===
            'Clocked Out Inside' ||
          ProfileReducer?.attendenceStatusResponse?.attendance_status_text ===
            'Clocked Out Other' ||
          ProfileReducer?.attendenceStatusResponse?.is_attendence_allowed ===
            false
        ) && (
          <TouchableOpacity
            disabled={
              (ProfileReducer?.attendenceStatusResponse?.status === 'pending' &&
                ProfileReducer?.attendenceStatusResponse
                  ?.is_attendance_given === 2) ||
              (ProfileReducer?.attendenceStatusResponse?.status === 'pending' &&
                ProfileReducer?.attendenceStatusResponse
                  ?.is_attendance_given === 3)
            }
            style={[
              styles.clockButton,
              {
                backgroundColor: (() => {
                  const { status, is_attendance_given } =
                    ProfileReducer?.attendenceStatusResponse || {};
                  if (status === 'pending' && is_attendance_given === 0)
                    return Colors.green;
                  if (status === 'pending' && is_attendance_given === 2)
                    return Colors.green;
                  if (status === 'pending' && is_attendance_given === 3)
                    return Colors.green;
                  if (status === 'present') return '#FFA500';
                  return Colors.grey;
                })(),
                opacity:
                  ProfileReducer?.attendenceStatusResponse?.status ===
                    'pending' &&
                  ProfileReducer?.attendenceStatusResponse
                    ?.is_attendance_given === 2
                    ? 0.5
                    : 1,
              },
            ]}
            onPress={handleClockAction}
          >
            <Text style={styles.clockButtonText}>
              {(() => {
                const { status, is_attendance_given } =
                  ProfileReducer?.attendenceStatusResponse || {};
                if (status === 'pending' && is_attendance_given === 0)
                  return 'Clock In';
                if (status === 'present' && is_attendance_given === 1)
                  return 'Clock Out';
                if (status === 'present' && is_attendance_given === 2)
                  return 'Clock Out';
                if (status === 'present' && is_attendance_given === 3)
                  return 'Clock Out';
              })()}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Clock In Modal */}
      <Modal
        animationIn={'slideInUp'}
        animationOut={'slideOutDown'}
        backdropTransitionOutTiming={0}
        backdropOpacity={0.7}
        hideModalContentWhileAnimating={true}
        isVisible={addTaskModal}
        animationInTiming={800}
        animationOutTiming={1000}
        onBackdropPress={() => setAddTaskModal(false)}
      >
        <ImageBackground resizeMode="stretch" style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.close}
            onPress={() => {
              setAddTaskModal(false);
            }}
          >
            <Image
              resizeMode="contain"
              source={Images.close}
              style={{ height: normalize(10), width: normalize(10) }}
            />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={{ paddingTop: 50 }}
            showsVerticalScrollIndicator={false}
          >
            <Image
              resizeMode="contain"
              style={{
                alignSelf: 'center',
                height: normalize(50),
                width: normalize(50),
                marginTop: -50,
              }}
              source={Images.app_logo}
            />

            <Text
              style={{
                textAlign: 'center',
                fontFamily: Fonts.MulishExtraBold,
                fontSize: 22,
                color: Colors.green,
                marginBottom: normalize(15),
                marginTop: normalize(20),
              }}
            >
              Select from where are you CLOCK IN
            </Text>

            <TouchableOpacity
              style={[
                styles.clockButton,
                {
                  backgroundColor: Colors.green,
                },
              ]}
              onPress={() => {
                getLocation('inside', 'present');
              }}
            >
              <Text style={styles.clockButtonText}>Office Duty</Text>
            </TouchableOpacity>
            {/* 
            <TouchableOpacity
              style={[
                styles.clockButton,
                {
                  backgroundColor: Colors.skyblue,
                },
              ]}
              onPress={() => {
                getLocation('outside', 'pending');
              }}
            >
              <Text style={styles.clockButtonText}>
                Official Visit Within ULB Jurisdiction
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.clockButton,
                {
                  backgroundColor: Colors.red,
                },
              ]}
              onPress={() => {
                getLocation('other', 'pending');
              }}
            >
              <Text style={styles.clockButtonText}>
                Official Visit Outside ULB Jurisdiction
              </Text>
            </TouchableOpacity> */}
          </ScrollView>
        </ImageBackground>
      </Modal>

      {/* <UpdateModal
        isVisible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
      /> */}
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#34495e',
  },
  scrollViewContent: {
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(10),
    paddingBottom: normalize(100),
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: normalize(10),
    backgroundColor: Colors.white,
    borderRadius: normalize(8),
    marginBottom: normalize(10),
  },
  userTextContainer: {
    width: '60%',
  },
  userName: {
    fontFamily: Fonts.MulishExtraBold,
    fontSize: 20,
  },
  phone: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 16,
  },
  userAddress: {
    fontFamily: Fonts.MulishBold,
    fontSize: 16,
    marginTop: 5,
  },
  blackText: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 16,
    marginTop: 5,
    color: Colors.black,
  },
  redText: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 16,
    marginTop: 5,
    color: Colors.red,
  },
  todayText: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 16,
    marginTop: 5,
    color: Colors.green,
  },
  imageContainer: {
    borderWidth: normalize(2),
    borderRadius: normalize(15),
    borderColor: Colors.skyblue,
    height: normalize(150),
    width: normalize(110),
    overflow: 'hidden',
  },
  userImage: {
    height: normalize(150),
    width: normalize(110),
  },
  userImagePlaceholder: {
    alignSelf: 'center',
    height: normalize(150),
    width: normalize(110),
  },
  clockButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: normalize(50),
    borderRadius: normalize(8),
    marginBottom: normalize(20),
  },
  clockButtonText: {
    fontFamily: Fonts.MulishBold,
    fontSize: 18,
    textAlign: 'center',
    width: '80%',
    color: Colors.white,
  },
  close: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.white,
    borderRadius: 50,
    padding: 5,
    height: normalize(20),
    width: normalize(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    height: normalize(400),
    justifyContent: 'center',
    padding: normalize(20),
    borderRadius: normalize(8),
    overflow: 'hidden',
    zIndex: 98,
  },
  // New styles for permission warnings
  permissionWarning: {
    marginTop: normalize(10),
    padding: normalize(8),
    backgroundColor: '#FFF3CD',
    borderRadius: normalize(5),
    borderLeftWidth: 3,
    borderLeftColor: '#FFA500',
  },
  permissionWarningText: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 14,
    color: '#856404',
    marginBottom: 5,
  },
  permissionText: {
    fontFamily: Fonts.MulishRegular,
    fontSize: 12,
    color: '#856404',
    marginLeft: 10,
  },
});
