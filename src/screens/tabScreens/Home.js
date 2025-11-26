import {
  Image,
  ImageBackground,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import Modal from 'react-native-modal';
import Header from '../../components/Header';
import { Colors, Fonts, Images } from '../../themes/ThemePath';
import { Camera } from 'react-native-vision-camera';
import normalize from '../../utils/helpers/normalize';
import Geolocation from '@react-native-community/geolocation';
import Loader from '../../utils/helpers/Loader';
import { getParkGeofencesListRequest } from '../../redux/reducer/ProfileReducer';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import connectionrequest from '../../utils/helpers/NetInfo';
import showErrorAlert from '../../utils/helpers/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

let status = '';

const Home = props => {
  const dispatch = useDispatch();
  const AuthReducer = useSelector(state => state.AuthReducer);
  const ProfileReducer = useSelector(state => state.ProfileReducer);
  const isFocused = useIsFocused();
  console.log('AuthReducer>>>>', AuthReducer?.signinResponse);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [location, setLocation] = useState({
    latitude: 22.5726,
    longitude: 88.3639,
  });

  // Dropdown states
  const [projectTypes, setProjectTypes] = useState([]);
  const [selectedProjectType, setSelectedProjectType] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);

  // User data state
  const [userData, setUserData] = useState(null);

  const saveUserData = async data => {
    try {
      console.log('JSON.stringify(data)>>>>>>>', JSON.stringify(data));
      await AsyncStorage.setItem('userData', JSON.stringify(data));
      console.log('User data saved successfully!');
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('userData');
      if (jsonValue != null) {
        const parsedData = JSON.parse(jsonValue);
        setUserData(parsedData);
        console.log('User data loaded from AsyncStorage:', parsedData);
      } else {
        console.log('No user data found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Save user data when AuthReducer updates
  useEffect(() => {
    saveUserData(AuthReducer?.signinResponse);
  }, [AuthReducer?.signinResponse]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setLoading(false);
      },
      error => {
        setLoading(false);
        console.log('Error getting location', error);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 },
    );
  };

  const checkPermission = async () => {
    const newCameraPermission = await Camera.requestCameraPermission();
  };

  function getParkGeofencesList() {
    connectionrequest()
      .then(() => {
        dispatch(getParkGeofencesListRequest());
      })
      .catch(err => {
        console.log(err);
        showErrorAlert('Please connect to internet');
      });
  }

  // Extract unique project types from the data
  useEffect(() => {
    if (
      ProfileReducer.getParkGeofencesListResponse &&
      ProfileReducer.getParkGeofencesListResponse.length > 0
    ) {
      const types = [
        ...new Set(
          ProfileReducer.getParkGeofencesListResponse
            .map(item => item.project_type)
            .filter(type => type !== ''),
        ),
      ];

      setProjectTypes(types);
    }
  }, [ProfileReducer.getParkGeofencesListResponse]);

  // Filter projects based on selected type
  useEffect(() => {
    if (selectedProjectType && ProfileReducer.getParkGeofencesListResponse) {
      const filtered = ProfileReducer.getParkGeofencesListResponse.filter(
        item => item.project_type === selectedProjectType,
      );
      setFilteredProjects(filtered);
      setSelectedProject('');
      setSelectedProjectDetails(null);
    } else {
      setFilteredProjects([]);
    }
  }, [selectedProjectType, ProfileReducer.getParkGeofencesListResponse]);

  // Set selected project details
  const handleProjectSelect = projectId => {
    setSelectedProject(projectId);
    if (projectId) {
      const project = filteredProjects.find(p => p.id.toString() === projectId);
      setSelectedProjectDetails(project);
    } else {
      setSelectedProjectDetails(null);
    }
  };

  const handleSubmit = async () => {
    const jsonValue = await AsyncStorage.getItem('userData');
    const userDetails = await JSON.parse(jsonValue);
    console.log('user Data=====>>', userDetails);

    if (selectedProjectDetails) {
      console.log('Submitting project:', selectedProjectDetails);
      setShowModal(false);
      props?.navigation.navigate('Geotracking', {
        park_details_id: selectedProjectDetails?.id,
        district_id: userDetails?.district_id,
        municipality_id: userDetails?.municipality_id,
        park_name: selectedProjectDetails?.park_stretch_name,
        description: 'Main public park...',
        latitude: location?.latitude,
        longitude: location?.longitude,
        radius_meters: 200,
      });
    } else {
      showErrorAlert('Please select a project first');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProjectType('');
    setSelectedProject('');
    setSelectedProjectDetails(null);
    setFilteredProjects([]);
  };

  const handleShowGeofencedArea = () => {
    // Navigate to show geofenced areas screen
    // You can implement this navigation based on your requirements
    props?.navigation.navigate('GeofencedAreaList'); // Update with your actual screen name
  };

  useEffect(() => {
    requestLocationPermission();
    getCurrentLocation();
    checkPermission();
    getParkGeofencesList();
  }, [isFocused]);

  if (status == '' || ProfileReducer.status != status) {
    switch (ProfileReducer.status) {
      case 'Profile/getParkGeofencesListRequest':
        status = ProfileReducer.status;
        break;
      case 'Profile/getParkGeofencesListSuccess':
        status = ProfileReducer.status;
        break;
      case 'Profile/getParkGeofencesListFailure':
        status = ProfileReducer.status;
        break;
    }
  }

  return (
    <ImageBackground
      source={Images.appBG}
      resizeMode="stretch"
      style={styles.mainContainer}
    >
      <Header
        HeaderLogo
        Title
        placeText={'Home'}
        onPress_back_button={() => {}}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={Images.wblogo}
          style={{
            zIndex: 99,
            marginTop: 25,
            height: normalize(100),
            width: normalize(100),
            alignSelf: 'center',
            marginBottom: 20,
          }}
          resizeMode="contain"
        />

        {/* User Information Card */}
        {userData && (
          <View style={styles.userInfoCard}>
            <Text style={styles.userInfoTitle}>User Information</Text>

            <View style={styles.userInfoRow}>
              <Text style={styles.userInfoLabel}>User ID:</Text>
              <Text style={styles.userInfoValue}>{userData.name}</Text>
            </View>

            <View style={styles.userInfoRow}>
              <Text style={styles.userInfoLabel}>Role:</Text>
              <Text style={styles.userInfoValue}>{userData.role_name}</Text>
            </View>

            <View style={styles.userInfoRow}>
              <Text style={styles.userInfoLabel}>District:</Text>
              <Text style={styles.userInfoValue}>{userData.district_name}</Text>
            </View>

            <View style={styles.userInfoRow}>
              <Text style={styles.userInfoLabel}>Municipality:</Text>
              <Text style={styles.userInfoValue}>
                {userData.municipality_name}
              </Text>
            </View>

            {userData.phone && (
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Phone:</Text>
                <Text style={styles.userInfoValue}>{userData.phone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Main Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.optionTitle}>Geofence a Area</Text>
            <Text style={styles.optionDescription}>
              Create a new geofenced area for monitoring
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleShowGeofencedArea}
          >
            <Text style={styles.optionTitle}>Show Geofenced Area</Text>
            <Text style={styles.optionDescription}>
              View all existing geofenced areas
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Geofencing Modal */}
      <Modal
        isVisible={showModal}
        onBackdropPress={handleCloseModal}
        onBackButtonPress={handleCloseModal}
        onSwipeComplete={handleCloseModal}
        swipeDirection={['down']}
        style={styles.modal}
        propagateSwipe={true}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.swipeIndicator} />
            <Text style={styles.modalTitle}>Geofence a Area</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseModal}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Project Type Dropdown */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.label}>Select Project Type</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedProjectType}
                  onValueChange={itemValue => setSelectedProjectType(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="-- Select Project Type --" value="" />
                  {projectTypes.map((type, index) => (
                    <Picker.Item key={index} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Project Name Dropdown */}
            {selectedProjectType && (
              <View style={styles.dropdownContainer}>
                <Text style={styles.label}>Select Project Name</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedProject}
                    onValueChange={handleProjectSelect}
                    style={styles.picker}
                  >
                    <Picker.Item label="-- Select Project --" value="" />
                    {filteredProjects.map(project => (
                      <Picker.Item
                        key={project.id}
                        label={project.park_stretch_name}
                        value={project.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Display Selected Project Details */}
            {selectedProjectDetails && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Project Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ward:</Text>
                  <Text style={styles.detailValue}>
                    {selectedProjectDetails.ward}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Project Code:</Text>
                  <Text style={styles.detailValue}>
                    {selectedProjectDetails.project_code}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedProjectDetails.park_stretch_name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {selectedProjectDetails.project_type}
                  </Text>
                </View>
              </View>
            )}

            {/* Submit Button */}
            {selectedProjectDetails && (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Geofence this area</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Loader visible={loading} />
    </ImageBackground>
  );
};

export default Home;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: normalize(20),
    paddingBottom: normalize(200),
  },
  userInfoCard: {
    backgroundColor: Colors.white,
    padding: normalize(20),
    borderRadius: normalize(12),
    borderWidth: 2,
    borderColor: Colors.skyblue,
    marginBottom: normalize(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfoTitle: {
    fontFamily: Fonts.MulishExtraBold,
    fontSize: 18,
    color: Colors.black,
    marginBottom: normalize(15),
    textAlign: 'center',
  },
  userInfoRow: {
    flexDirection: 'row',
    marginBottom: normalize(12),
    alignItems: 'center',
  },
  userInfoLabel: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 14,
    color: Colors.black,
    width: '40%',
  },
  userInfoValue: {
    fontFamily: Fonts.MulishRegular,
    fontSize: 14,
    color: Colors.black,
    width: '60%',
    flexWrap: 'wrap',
  },
  optionsContainer: {
    gap: normalize(20),
  },
  optionCard: {
    backgroundColor: Colors.white,
    padding: normalize(25),
    borderRadius: normalize(12),
    borderWidth: 2,
    borderColor: Colors.skyblue,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionTitle: {
    fontFamily: Fonts.MulishExtraBold,
    fontSize: 20,
    color: Colors.black,
    marginBottom: normalize(8),
  },
  optionDescription: {
    fontFamily: Fonts.MulishRegular,
    fontSize: 14,
    color: Colors.black,
    opacity: 0.7,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    height: '90%',
  },
  modalHeader: {
    padding: normalize(20),
    borderBottomWidth: 1,
    borderBottomColor: Colors.skyblue,
    alignItems: 'center',
  },
  swipeIndicator: {
    width: normalize(40),
    height: normalize(4),
    backgroundColor: Colors.skyblue,
    borderRadius: normalize(2),
    marginBottom: normalize(15),
  },
  modalTitle: {
    fontFamily: Fonts.MulishExtraBold,
    fontSize: 20,
    color: Colors.black,
  },
  closeButton: {
    position: 'absolute',
    right: normalize(20),
    top: normalize(20),
    width: normalize(30),
    height: normalize(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.black,
    fontWeight: '600',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: normalize(20),
  },
  dropdownContainer: {
    marginBottom: normalize(20),
  },
  label: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 16,
    color: Colors.black,
    marginBottom: normalize(8),
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: Colors.skyblue,
    borderRadius: normalize(8),
    backgroundColor: Colors.white,
  },
  picker: {
    height: normalize(50),
  },
  detailsContainer: {
    backgroundColor: Colors.white,
    padding: normalize(15),
    borderRadius: normalize(8),
    borderWidth: 1,
    borderColor: Colors.skyblue,
    marginBottom: normalize(20),
  },
  detailsTitle: {
    fontFamily: Fonts.MulishExtraBold,
    fontSize: 18,
    color: Colors.black,
    marginBottom: normalize(15),
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: normalize(10),
  },
  detailLabel: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 14,
    color: Colors.black,
    width: '40%',
  },
  detailValue: {
    fontFamily: Fonts.MulishRegular,
    fontSize: 14,
    color: Colors.black,
    width: '60%',
    flexWrap: 'wrap',
  },
  submitButton: {
    backgroundColor: Colors.skyblue,
    padding: normalize(15),
    borderRadius: normalize(8),
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  submitButtonText: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 18,
    color: Colors.white,
    fontWeight: '700',
  },
});
