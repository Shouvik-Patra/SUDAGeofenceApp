import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { Colors, Fonts, Images } from '../../themes/ThemePath';
import showErrorAlert from '../../utils/helpers/Toast';
import normalize from '../../utils/helpers/normalize';
import moment from 'moment';
import { Dropdown } from 'react-native-element-dropdown';
import Modal from 'react-native-modal';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import {
  municipalityOfficeListRequest,
  municipalityRegisterListRequest,
  userDetailsRequest,
} from '../../redux/reducer/ProfileReducer';
import connectionrequest from '../../utils/helpers/NetInfo';
import Loader from '../../utils/helpers/Loader';
import { LocationGeocoder } from '../../components/LocationGeocoder';
let status = '';
const MuRegister = props => {
  const dispatch = useDispatch();
  const AuthReducer = useSelector(state => state.AuthReducer);
  const ProfileReducer = useSelector(state => state.ProfileReducer);

  const isFocused = useIsFocused();
  const [isClocked, setIsClocked] = useState(false);
  const [addTaskModal, setAddTaskModal] = useState(false);

  const [officeList, setOfficeList] = useState([]);
  const [complitedTaskData, setComplitedTaskData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocusTask, setIsFocusTask] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState('');
  console.log('complitedTaskData>>>>>', complitedTaskData);
  console.log('officeList>>>>>', officeList);

  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Access Required',
          message: 'This App needs to Access your location',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getOneTimeLocation();
      } else {
        setLocationStatus('Permission Denied');
        Linking.openSettings();
      }
    } catch (err) {
      console.warn(err);
    }
  };
  const getOneTimeLocation = () => {
    Geolocation.getCurrentPosition(
      //Will give you the current location

      position => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
      },
      error => {
        console.log(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 1000,
      },
    );
  };

  const handleTaskSelect = async item => {
    setSelectedOffice(item.id);
    setIsFocusTask(false);
  };
  function getMunicipalityRegisterList() {
    connectionrequest()
      .then(() => {
        dispatch(municipalityRegisterListRequest());
      })
      .catch(err => {
        console.log(err);
        showErrorAlert('Please connect to internet');
      });
  }
  useEffect(() => {
    if (isFocused) {
      requestLocationPermission();
      getMunicipalityRegisterList();
      connectionrequest()
        .then(() => {
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

  function getMuOfficeList() {
    let mu_name = ProfileReducer?.userDetailsResponse?.municipality;

    connectionrequest()
      .then(() => {
        dispatch(municipalityOfficeListRequest(mu_name));
      })
      .catch(err => {
        console.log(err);
        showErrorAlert('Please connect to internet');
      });
  }

  const getLocation = async () => {
    if (selectedOffice == '') {
      Alert.alert('Please select your office');
    } else {
      setAddTaskModal(false);

      setLoading(true);
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          handleClickPhoto(latitude, longitude);
        },
        error => {
          setLoading(false);
          console.log('Error getting location', error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    }
  };
  const handleClickPhoto = async (lat, long) => {
    const result = await LocationGeocoder(lat, long);
    const actualAddress = result?.address || 'Unknown Address';
    setAddTaskModal(false);
    setLoading(false);
    props?.navigation.navigate('Attendence', {
      currentAddress: actualAddress,
      latitude: lat,
      longitude: long,
      pagename: 'MuRegister',
      status: 'MuRegister',
      office_id: selectedOffice,
    });
  };

  const renderTaskList = ({ item, index }) => (
    <View style={styles.userInfoContainer}>
      <View style={styles.userTextContainer}>
        <Text style={styles.blackText}>
          Office :{' '}
          <Text
            style={[
              styles.redText,
              { color: isClocked ? Colors.green : Colors.red },
            ]}
          >
            {item?.office_name}
          </Text>
        </Text>
        <Text style={styles.userAddress}>{item?.address}</Text>
        <Text style={styles.blackText}>
          latitude :{' '}
          <Text
            style={[
              styles.redText,
              { color: isClocked ? Colors.green : Colors.red },
            ]}
          >
            {item?.latitude}
          </Text>
        </Text>
        <Text style={styles.blackText}>
          longitude :{' '}
          <Text
            style={[
              styles.redText,
              { color: isClocked ? Colors.green : Colors.red },
            ]}
          >
            {item?.longitude}
          </Text>
        </Text>
        <Text style={styles.blackText}>
          Created at :{' '}
          <Text
            style={[
              styles.redText,
              { color: isClocked ? Colors.green : Colors.red },
            ]}
          >
            {/* {moment. item?.created_at} */}
            {moment(item?.created_at)
              .local()
              .format('ddd, MMM D, YYYY • h:mm A')}
          </Text>
        </Text>
      </View>
      <View style={styles.imageContainer}>
        {item?.photo ? (
          <Image
            resizeMode="stretch"
            style={styles.userImagePlaceholder}
            source={{ uri: item?.photo }}
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
  );
  const renderFooter = () => (
    <TouchableOpacity
      style={{
        width: '100%',
        height: normalize(100),
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: normalize(10),
      }}
      onPress={() => {
        getMuOfficeList();
        setAddTaskModal(true);
      }}
    >
      <Image
        resizeMode="contain"
        style={{ height: 50, width: 50 }}
        source={
          ProfileReducer?.attendenceStatusResponse?.attendance_status_text ==
          'Clocked In'
            ? Images.addTask
            : Images.lock
        }
      />
      <Text style={styles.newTask}>Add New Office</Text>
    </TouchableOpacity>
  );
  useEffect(() => {
    if (ProfileReducer?.municipalityRegisterListResponse?.length > 0) {
      setComplitedTaskData(ProfileReducer.municipalityRegisterListResponse);
    }
  }, [ProfileReducer.municipalityRegisterListResponse]);

  useEffect(() => {
    if (ProfileReducer?.municipalityOfficeListResponse?.length > 0) {
      setOfficeList(ProfileReducer?.municipalityOfficeListResponse);
    }
  }, [ProfileReducer?.municipalityOfficeListResponse]);

  if (status == '' || ProfileReducer.status != status) {
    switch (ProfileReducer.status) {
      case 'Profile/userDetailsRequest':
        status = ProfileReducer.status;
        setLoading(true);
        break;
      case 'Profile/userDetailsSuccess':
        status = ProfileReducer.status;
        setLoading(false);
        break;
      case 'Profile/userDetailsFailure':
        status = ProfileReducer.status;

        setLoading(false);
        break;
      case 'Profile/municipalityRegisterListRequest':
        status = ProfileReducer.status;
        setLoading(true);
        break;
      case 'Profile/municipalityRegisterListSuccess':
        status = ProfileReducer.status;
        setLoading(false);
        setComplitedTaskData(ProfileReducer?.municipalityRegisterListResponse);
        break;
      case 'Profile/municipalityRegisterListFailure':
        status = ProfileReducer.status;

        setLoading(false);
        break;

      case 'Profile/municipalityRegisterRequest':
        status = ProfileReducer.status;
        setLoading(true);
        break;
      case 'Profile/municipalityRegisterSuccess':
        status = ProfileReducer.status;
        setSelectedOffice('');
        getMunicipalityRegisterList();

        setLoading(false);
        break;
      case 'Profile/municipalityRegisterFailure':
        status = ProfileReducer.status;
        setLoading(false);
        break;

      case 'Profile/municipalityOfficeListRequest':
        status = ProfileReducer.status;
        setLoading(true);
        break;
      case 'Profile/municipalityOfficeListSuccess':
        status = ProfileReducer.status;
        setOfficeList(ProfileReducer?.municipalityOfficeListResponse);
        setLoading(false);
        break;
      case 'Profile/municipalityOfficeListFailure':
        status = ProfileReducer.status;
        setLoading(false);
        break;
    }
  }

  return (
    <View style={styles.mainContainer}>
      <Header
        HeaderLogo
        Title
        placeText={'Register Your Office'}
        onPress_back_button={() => {}}
        onPress_right_button={() => {
          props.navigation.navigate('Notification');
        }}
      />
      <Loader visible={loading} />

      <FlatList
        data={complitedTaskData}
        style={styles.scrollView}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        renderItem={renderTaskList}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
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
        <ImageBackground
          resizeMode="stretch"
          source={Images.pageBackground}
          style={styles.modalContainer}
        >
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
          <ScrollView contentContainerStyle={{ paddingTop: 50 }}>
            <Image
              resizeMode="contain"
              style={{
                alignSelf: 'center',
                height: normalize(100),
                width: normalize(100),
                marginTop: -50,
              }}
              source={Images.wb_logo}
            />
            <Text style={styles.instructionLebel}>*Instruction:</Text>
            <Text style={styles.instructionText}>
              While taking the photo, make sure you are standing at a central
              location inside the municipality office.
            </Text>

            <Text style={styles.instructionLebel}>*নির্দেশিকা:</Text>
            <Text style={styles.instructionText}>
              ছবি তোলার সময় খেয়াল রাখবেন যেন আপনি মিউনিসিপ্যালিটি অফিসের ভিতরে
              কোনো কেন্দ্রস্থলে দাঁড়িয়ে ছবি তোলেন।
            </Text>

            <Text
              style={{
                textAlign: 'center',
                fontFamily: Fonts.MulishExtraBold,
                fontSize: 24,
                color: Colors.white,
                marginBottom: normalize(15),
                marginTop: normalize(20),
              }}
            >
              Register Your Office
            </Text>
            <Text
              style={{
                textAlign: 'left',
                fontFamily: Fonts.MulishBold,
                fontSize: 16,
                color: Colors.white,
                marginBottom: 5,
              }}
            >
              Select office
            </Text>
            <View style={styles.dropdownContainer}>
              <Dropdown
                style={[
                  styles.dropdown,
                  isFocusTask && { borderColor: '#24bcf7' },
                ]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                containerStyle={styles.dropdownListContainer}
                itemTextStyle={styles.dropdownItemText}
                data={officeList}
                maxHeight={300}
                labelField="name"
                valueField="id"
                placeholder={!isFocusTask ? 'Select office' : '...'}
                searchPlaceholder="Search..."
                value={selectedOffice}
                onFocus={() => setIsFocusTask(true)}
                onBlur={() => setIsFocusTask(false)}
                onChange={handleTaskSelect}
                renderLeftIcon={() => <Text style={styles.icon}>📋</Text>}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.clockButton,
                {
                  backgroundColor: Colors.orange,
                },
              ]}
              onPress={() => {
                getLocation();
              }}
            >
              <Text style={styles.clockButtonText}>Register Office</Text>
            </TouchableOpacity>
          </ScrollView>
        </ImageBackground>
      </Modal>
    </View>
  );
};

export default MuRegister;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#34495e',
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
    height: normalize(400),
    justifyContent: 'center',
    padding: normalize(20),
    borderRadius: normalize(8),
    overflow: 'hidden',
    zIndex: 98,
  },
  scrollView: {
    flex: 1,
    marginTop: normalize(10),
    width: '95%',
    alignSelf: 'center',
  },
  scrollViewContent: {
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(10),
    paddingBottom: normalize(100), // Extra padding at bottom
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
  newTask: {
    fontFamily: Fonts.MulishBold,
    fontSize: 16,
    color: Colors.black,
    marginTop: normalize(5),
  },
  userAddress: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 5,
  },
  blackText: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 5,
    color: Colors.black,
  },
  redText: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 5,
    color: Colors.red,
  },
  todayText: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 5,
    color: Colors.green,
  },
  imageContainer: {
    borderWidth: normalize(2),
    borderRadius: normalize(15),
    borderColor: Colors.skyblue,
    height: normalize(150),
    width: normalize(120),
    overflow: 'hidden',
  },
  userImage: {
    height: normalize(170),
    width: normalize(120),
  },
  userImagePlaceholder: {
    alignSelf: 'center',
    height: normalize(150),
    width: normalize(120),
  },
  mapSection: {
    width: '100%',
    padding: normalize(5),
    backgroundColor: Colors.white,
    borderRadius: normalize(8),
    marginBottom: normalize(15),
  },
  mapContainer: {
    height: normalize(300),
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 8,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapImage: {
    height: normalize(300),
    width: '100%',
  },
  clockButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: normalize(50),
    borderRadius: normalize(8),
    marginBottom: normalize(20),
  },
  clockButtonText: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
  },
  dropdownContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  dropdown: {
    height: 50,
    width: '100%',
    borderColor: '#2494ea',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  // New styles for dropdown list styling
  dropdownListContainer: {
    backgroundColor: Colors.greytext, // Green background for dropdown list
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItemText: {
    color: '#000000', // Black text color for dropdown items
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: 10,
    fontSize: 18,
  },
  instructionLebel: {
    fontFamily: Fonts.MulishBold,
    fontSize: 22,
    marginTop: normalize(5),
    color: Colors.white,
  },
  instructionText: {
    fontFamily: Fonts.MulishRegular,
    fontSize: 18,
    marginTop: normalize(5),
    color: Colors.white,
  },
});
