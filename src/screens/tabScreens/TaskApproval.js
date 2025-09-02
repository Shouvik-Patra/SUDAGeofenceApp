import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Colors, Fonts, Images } from '../../themes/ThemePath';
import showErrorAlert from '../../utils/helpers/Toast';
import normalize from '../../utils/helpers/normalize';
import moment from 'moment';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import Modal from 'react-native-modal';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  addTaskRequest,
  attendenceStatusRequest,
  taskApprovalListRequest,
  taskListRequest,
  taskLocationRequest,
} from '../../redux/reducer/ProfileReducer';
import connectionrequest from '../../utils/helpers/NetInfo';
import Loader from '../../utils/helpers/Loader';
import TextInputWithButton from '../../components/TextInputWithBotton';
import constants from '../../utils/helpers/constants';
import MessageModal from '../../components/MessageModal';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
let status = '';

const TaskApproval = (props) => {
  const dispatch = useDispatch();
  const ProfileReducer = useSelector(state => state.ProfileReducer);
  const [refreshing, setRefreshing] = useState(false);

  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);
  const [loader, setLoader] = useState(false);
  const [addTaskModal, setAddTaskModal] = useState(false);
  const [TaskLocationList, setTaskLocation] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [locationString, setLocationString] = useState('');
  const [TaskPurposeList, setTaskPurposeList] = useState([]);
  const [taskApprovalData, setTaskApprovalData] = useState([]);

  const [isFocusTask1, setIsFocusTask1] = useState(false);
  const [isFocusTask2, setIsFocusTask2] = useState(false);
  const [selectedTaskLocation, setSelectedTasklocatio] = useState('');
  const [selectedTaskPurpose, setSelectedTaskPurpose] = useState('');

  const [other_location, setOther_location] = useState('');
  const [other_purpose, setOther_purpose] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Validation error states
  const [locationError, setLocationError] = useState('');
  const [purposeError, setPurposeError] = useState('');
  const [otherLocationError, setOtherLocationError] = useState('');
  const [otherPurposeError, setOtherPurposeError] = useState('');
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');

  // New state variables for date/time pickers
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [supportingDocument, setSupportingDocument] = useState(null);
  const [showFileOptions, setShowFileOptions] = useState(false);

  // Clear all validation errors
  const clearValidationErrors = () => {
    setLocationError('');
    setPurposeError('');
    setOtherLocationError('');
    setOtherPurposeError('');
    setStartDateError('');
    setEndDateError('');
  };

  // Validate form
  const validateForm = () => {
    clearValidationErrors();
    let isValid = true;

    // Validate task purpose
    if (!selectedTaskPurpose?.id) {
      setPurposeError('Please select task purpose');
      isValid = false;
    }

    // Check if "Others" is selected in locations and other_location is empty
    if (selectedLocations.includes('Others') && other_location.trim() === '') {
      setOtherLocationError('Please enter other location details');
      isValid = false;
    }

    if (
      selectedTaskPurpose?.title === 'Others' &&
      other_purpose.trim() === ''
    ) {
      setOtherPurposeError('Please enter other purpose details');
      isValid = false;
    }

    if (!startDate) {
      setStartDateError('Please select start date');
      isValid = false;
    }

    if (!endDate) {
      setEndDateError('Please select end date');
      isValid = false;
    }

    // Combine date and time for validation
    if (startDate && endDate) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(
        startTime.getHours(),
        startTime.getMinutes(),
        0,
        0,
      );

      const endDateTime = new Date(endDate);
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

      if (endDateTime < startDateTime) {
        setEndDateError('End date and time must be after start date and time');
        isValid = false;
      }
    }

    return isValid;
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Handle file selection options
  const handleFileOptions = () => {
    setShowFileOptions(true);
  };

  // Handle camera option
  const handleCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showErrorAlert('Camera permission is required');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchCamera(options, response => {
      setShowFileOptions(false);
      if (response.didCancel || response.errorMessage) {
        return;
      }
      if (response.assets && response.assets[0]) {
        setSupportingDocument(response.assets[0]);
      }
    });
  };

  // Handle gallery option
  const handleGallery = () => {
    const options = {
      mediaType: 'mixed',
      quality: 0.7,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, response => {
      setShowFileOptions(false);
      if (response.didCancel || response.errorMessage) {
        return;
      }
      if (response.assets && response.assets[0]) {
        setSupportingDocument(response.assets[0]);
      }
    });
  };

  // Remove selected file
  const removeFile = () => {
    setSupportingDocument(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(taskApprovalListRequest('pending,rejected'));
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Date/Time picker handlers
  const onStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
    // Clear start date error when user selects a date
    if (startDateError) setStartDateError('');
  };

  const onEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
    // Clear end date error when user selects a date
    if (endDateError) setEndDateError('');
  };

  const onStartTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || startTime;
    setShowStartTimePicker(Platform.OS === 'ios');
    setStartTime(currentTime);
  };

  const onEndTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || endTime;
    setShowEndTimePicker(Platform.OS === 'ios');
    setEndTime(currentTime);
  };

  const handleTaskPurposeSelect = async item => {
    setSelectedTaskPurpose(item);
    setIsFocusTask2(false);
    // Clear purpose error when user selects an item
    if (purposeError) setPurposeError('');
  };

  const handleLocationSelect = items => {
    setSelectedLocations(items);
    setLocationString(items.join(','));
    // Clear location error when user selects locations
    if (locationError) setLocationError('');
  };

  const handleOtherLocationChange = text => {
    setOther_location(text);
    // Clear other location error when user types
    if (otherLocationError) setOtherLocationError('');
  };

  const handleOtherPurposeChange = text => {
    setOther_purpose(text);
    // Clear other purpose error when user types
    if (otherPurposeError) setOtherPurposeError('');
  };

  useEffect(() => {
    if (isFocused) {
      connectionrequest()
        .then(() => {
          dispatch(taskListRequest());
          dispatch(taskLocationRequest());
          dispatch(taskApprovalListRequest(`pending,rejected`));
        })
        .catch(err => {
          console.log(err);
          showErrorAlert('Please connect to internet');
        });
    } else {
      setAddTaskModal(false);
    }
  }, [isFocused]);

  const buttonResRef = useRef(null);

  const getLocation = async (taskid, buttonRes) => {
    // First validate the form
    if (!validateForm()) {
      return; // Don't proceed if validation fails, modal stays open
    }

    setLoading(true);
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        onAddNewTask(latitude, longitude);
      },
      error => {
        setLoading(false);
        showErrorAlert('Failed to get location. Please try again.');
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 },
    );
  };

  const onAddNewTask = async (lat, long) => {
    const imageName = supportingDocument?.uri?.split('/').pop();
    const imageType = 'image/jpeg';

    const formData = new FormData();
    formData.append('location_id', selectedTaskPurpose?.id);
    formData.append('task_name', locationString);
    formData.append('other_location', other_location);
    formData.append('other_purpose', other_purpose);
    formData.append('date', moment(new Date()).format('YYYY-MM-DD'));
    formData.append('time', moment().format('HH:mm:ss'));
    formData.append('createTaskDate', moment(startDate).format('YYYY-MM-DD'));
    formData.append('endTaskDate', moment(endDate).format('YYYY-MM-DD'));
    formData.append('start_time', moment(startTime).format('HH:mm:ss'));
    formData.append('end_time', moment(endTime).format('HH:mm:ss'));
    formData.append('latitude', lat);
    formData.append('longitude', long);

    if (supportingDocument?.uri != undefined) {
      formData.append('photo', {
        uri:
          Platform.OS === 'android'
            ? supportingDocument?.uri
            : supportingDocument?.uri?.replace('file://', ''),
        name: imageName,
        type: imageType,
      });
    }
    formData.append('app_version', constants.APP_VERSION);

    connectionrequest()
      .then(() => {
        dispatch(addTaskRequest(formData));
        setAddTaskModal(false);

      })
      .catch(err => {
        console.log(err);
        setLoading(false);
        showErrorAlert('Please connect to internet');
      });
  };

  // Reset form function
  const resetForm = () => {
    setSelectedTasklocatio('');
    setSelectedTaskPurpose('');
    setSelectedLocations([]);
    setLocationString('');
    setOther_location('');
    setOther_purpose('');
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date());
    setSupportingDocument(null);
    clearValidationErrors();
  };

  const renderTaskList = ({ item, index }) => (
    <View
      style={[
        styles.userInfoContainer,
        {
          backgroundColor:
            item?.status == 'approved'
              ? Colors.lightgreen
              : item?.status == 'pending'
              ? Colors.lightred
              : item?.status == 'ongoing'
              ? Colors.lightYellow
              : item?.status == 'complete'
              ? Colors.lightgreen
              : Colors.lightred,
        },
      ]}
    >
      <View style={styles.userTextContainer}>
        <Text style={styles.blackText}>
          Visit Location(s) :{' '}
          <Text style={styles.redText}>
            {item?.task_name ? item?.task_name : ''}
          </Text>
        </Text>
        {item?.other_location && (
          <Text style={styles.blackText}>
            Other Location(s) :{' '}
            <Text style={styles.redText}>
              {item?.other_location ? item?.other_location : ''}
            </Text>
          </Text>
        )}
        <Text style={styles.blackText}>
          Visit Purpose :{' '}
          <Text style={styles.redText}>
            {item?.task_title ? item?.task_title : ''}
          </Text>
        </Text>
        {item?.other_purpose && (
          <Text style={styles.blackText}>
            Other Purpose(s) :{' '}
            <Text style={styles.redText}>
              {item?.other_purpose ? item?.other_purpose : ''}
            </Text>
          </Text>
        )}
        <Text style={styles.blackText}>
          Created at :{' '}
          <Text style={styles.redText}>
            {moment(item?.created_at).format('ddd, MMM D, YYYY')}
          </Text>
        </Text>
        <Text style={styles.blackText}>
          Status :{' '}
          <Text
            style={[
              styles.redText,
              {
                color: item?.status == 'rejected' ? Colors.red : Colors.green,
                textTransform: 'capitalize',
              },
            ]}
          >
            {item?.status}
          </Text>
        </Text>
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
        setAddTaskModal(true);
        resetForm(); // Reset form when opening modal
      }}
    >
      <Image
        resizeMode="contain"
        style={{ height: 50, width: 50 }}
        source={Images.addTask}
      />
      <Text style={styles.newTask}>Add New</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    if (ProfileReducer?.taskLocationResponse?.length > 0) {
      let filteredLocations = ProfileReducer.taskLocationResponse;

      if (
        ProfileReducer?.attendenceStatusResponse?.attendance_status_text ===
        'Clocked In Other'
      ) {
        filteredLocations = ProfileReducer.taskLocationResponse.filter(
          location => location.priority === 'high',
        );
      }

      setTaskLocation(filteredLocations);
    }
  }, [
    ProfileReducer.taskLocationResponse,
    ProfileReducer.attendenceStatusResponse,
  ]);

  useEffect(() => {
    if (ProfileReducer?.taskListResponse?.length > 0) {
      setTaskPurposeList(ProfileReducer.taskListResponse);
    }
  }, [ProfileReducer.taskListResponse]);

  useEffect(() => {
    if (ProfileReducer?.taskApprovalListResponse?.length > 0) {
      setTaskApprovalData(ProfileReducer.taskApprovalListResponse);
      dispatch(attendenceStatusRequest());
    }
  }, [ProfileReducer.taskApprovalListResponse]);
  // useEffect(() => {
  //   // console.log('PAGE NAME===========>>>>>', props?.route?.name);
  //     console.log("Shouvik>>>>>>>>>>>>>>>",ProfileReducer.status,"--",props?.route?.name);

  //   if (ProfileReducer.status == 'Profile/addTaskSuccess') {
  //     console.log("Heloooo?????????/",ProfileReducer.status);
  //     setShowMessageModal(true);
  //     setLoading(false);
  //     setAddTaskModal(false);
  //     resetForm();
  //     dispatch(taskApprovalListRequest(`pending,rejected`));
  //   } else if (ProfileReducer.status == 'Profile/addTaskFailure') {
  //     setLoading(false);
  //   } else {
  //     console.log('hello!');
  //   }
  // }, [ProfileReducer.status]);
  if (status == '' || ProfileReducer.status != status) {
    switch (ProfileReducer.status) {
      case 'Profile/taskLocationRequest':
        status = ProfileReducer.status;
        break;
      case 'Profile/taskLocationSuccess':
        status = ProfileReducer.status;
        break;
      case 'Profile/taskLocationFailure':
        status = ProfileReducer.status;
        break;
      case 'Profile/taskListRequest':
        status = ProfileReducer.status;
        break;
      case 'Profile/taskListSuccess':
        status = ProfileReducer.status;
        break;
      case 'Profile/taskListFailure':
        status = ProfileReducer.status;
        break;
      case 'Profile/taskApprovalListRequest':
        status = ProfileReducer.status;
        break;
      case 'Profile/taskApprovalListSuccess':
        status = ProfileReducer.status;
        break;
      case 'Profile/addTaskRequest':
        status = ProfileReducer.status;
        break;
      case 'Profile/addTaskSuccess':
        status = ProfileReducer.status;
        setShowMessageModal(true);
        setLoading(false);
        setAddTaskModal(false);
        resetForm();
        dispatch(taskApprovalListRequest(`pending,rejected`));
        break;
      case 'Profile/addTaskFailure':
        status = ProfileReducer.status;
        setLoading(false);
        break;
    }
  }

  // Error message component
  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return <Text style={styles.errorText}>{error}</Text>;
  };

  return (
    <View style={styles.mainContainer}>
      <Loader
        visible={
          loader ||
          ProfileReducer?.status == 'Profile/taskLocationRequest' ||
          ProfileReducer?.status == 'Profile/taskListRequest' ||
          ProfileReducer?.status == 'Profile/taskApprovalListRequest' ||
          ProfileReducer?.status == 'Profile/addTaskRequest'
        }
      />

      <FlatList
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        data={taskApprovalData}
        keyExtractor={item => item.id}
        renderItem={renderTaskList}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <TouchableOpacity
        onPress={() => {
          onRefresh();
        }}
        style={{
          position: 'absolute',
          bottom: normalize(140),
          right: normalize(15),
          backgroundColor: Colors.skyblue,
          borderRadius: normalize(50),
          padding: normalize(10),
        }}
      >
        <Image
          resizeMode="contain"
          style={{
            width: normalize(22),
            height: normalize(22),
            tintColor: Colors.white,
          }}
          source={Images.refresh}
        />
      </TouchableOpacity>

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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            <TouchableOpacity
              style={styles.close}
              onPress={() => {
                setAddTaskModal(false);
                onRefresh();
              }}
            >
              <Image
                resizeMode="contain"
                source={Images.close}
                style={{ height: normalize(10), width: normalize(10) }}
              />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Ask For Approval</Text>

            <Text style={styles.fieldLabel}>Select visit location</Text>
            <View style={styles.dropdownContainer}>
              <MultiSelect
                style={[
                  styles.dropdown,
                  isFocusTask1 && { borderColor: '#24bcf7' },
                  locationError && { borderColor: Colors.red },
                ]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                containerStyle={styles.dropdownListContainer}
                itemTextStyle={styles.dropdownItemText}
                data={TaskLocationList}
                maxHeight={300}
                labelField="location_name"
                valueField="location_name"
                placeholder={!isFocusTask1 ? 'Select location(s)' : '...'}
                searchPlaceholder="Search..."
                value={selectedLocations}
                onFocus={() => setIsFocusTask1(true)}
                onBlur={() => setIsFocusTask1(false)}
                onChange={handleLocationSelect}
                renderLeftIcon={() => <Text style={styles.icon}>📋</Text>}
              />
              <ErrorMessage error={locationError} />

              {selectedLocations.includes('Others') && (
                <View style={{ width: '100%' }}>
                  <TextInputWithButton
                    show={true}
                    icon={true}
                    height={normalize(45)}
                    inputWidth={'100%'}
                    marginTop={normalize(15)}
                    backgroundColor={Colors.white}
                    textColor={Colors.textInputColor}
                    InputHeaderText={'Other location'}
                    placeholder={'Other location'}
                    placeholderTextColor={Colors.black}
                    paddingLeft={normalize(25)}
                    borderColor={
                      otherLocationError ? Colors.red : Colors.skyblue
                    }
                    borderRadius={normalize(5)}
                    editable={true}
                    fontFamily={Fonts.MulishRegular}
                    isheadertext={true}
                    value={other_location}
                    fontSize={normalize(14)}
                    headertxtsize={normalize(13)}
                    onChangeText={handleOtherLocationChange}
                    tintColor={Colors.tintGrey}
                  />
                  <ErrorMessage error={otherLocationError} />
                </View>
              )}
            </View>

            <Text style={styles.fieldLabel}>Select visit purpose</Text>
            <View style={styles.dropdownContainer}>
              <Dropdown
                style={[
                  styles.dropdown,
                  isFocusTask2 && { borderColor: '#24bcf7' },
                  purposeError && { borderColor: Colors.red },
                ]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                containerStyle={styles.dropdownListContainer}
                itemTextStyle={styles.dropdownItemText}
                data={TaskPurposeList}
                maxHeight={300}
                labelField="title"
                valueField="id"
                placeholder={!isFocusTask2 ? 'Select purpose' : '...'}
                searchPlaceholder="Search..."
                value={selectedTaskPurpose?.id}
                onFocus={() => setIsFocusTask2(true)}
                onBlur={() => setIsFocusTask2(false)}
                onChange={handleTaskPurposeSelect}
                renderLeftIcon={() => <Text style={styles.icon}>📋</Text>}
              />
              <ErrorMessage error={purposeError} />

              {selectedTaskPurpose?.title == 'Others' && (
                <View style={{ width: '100%' }}>
                  <TextInputWithButton
                    show={true}
                    icon={true}
                    height={normalize(45)}
                    inputWidth={'100%'}
                    backgroundColor={Colors.white}
                    marginTop={normalize(15)}
                    textColor={Colors.textInputColor}
                    InputHeaderText={'Other purpose'}
                    placeholder={'Other purpose'}
                    placeholderTextColor={Colors.black}
                    paddingLeft={normalize(25)}
                    borderColor={
                      otherPurposeError ? Colors.red : Colors.skyblue
                    }
                    borderRadius={normalize(5)}
                    editable={true}
                    fontFamily={Fonts.MulishRegular}
                    isheadertext={true}
                    value={other_purpose}
                    fontSize={normalize(14)}
                    headertxtsize={normalize(13)}
                    onChangeText={handleOtherPurposeChange}
                    tintColor={Colors.tintGrey}
                  />
                  <ErrorMessage error={otherPurposeError} />
                </View>
              )}
            </View>

            {/* Start Date and Time Section */}
            <Text style={styles.fieldLabel}>Start Date *</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  startDateError && { borderColor: Colors.red },
                ]}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateTimeButtonText}>
                  📅 {moment(startDate).format('DD/MM/YYYY')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.dateTimeButtonText}>
                  🕐 {moment(startTime).format('HH:mm')}
                </Text>
              </TouchableOpacity>
            </View>
            <ErrorMessage error={startDateError} />

            {/* End Date and Time Section */}
            <Text style={styles.fieldLabel}>End Date *</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  endDateError && { borderColor: Colors.red },
                ]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateTimeButtonText}>
                  📅 {moment(endDate).format('DD/MM/YYYY')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.dateTimeButtonText}>
                  🕐 {moment(endTime).format('HH:mm')}
                </Text>
              </TouchableOpacity>
            </View>
            <ErrorMessage error={endDateError} />

            {/* Supporting Document Section */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Supporting Document </Text>

              {supportingDocument ? (
                <View style={styles.fileContainer}>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>
                      {supportingDocument.fileName || 'Selected file'}
                    </Text>
                    <Text style={styles.fileSize}>
                      {supportingDocument.fileSize
                        ? `${(supportingDocument.fileSize / 1024).toFixed(
                            1,
                          )} KB`
                        : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={removeFile}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleFileOptions}
                >
                  <Text style={styles.uploadIcon}>📎</Text>
                  <Text style={styles.uploadText}>Upload Photo/Document</Text>
                </TouchableOpacity>
              )}
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
              <Text style={styles.clockButtonText}>Send for Approval</Text>
            </TouchableOpacity>
          </ScrollView>
        </ImageBackground>
      </Modal>

      {/* File Options Modal */}
      <Modal
        animationIn={'slideInUp'}
        animationOut={'slideOutDown'}
        backdropTransitionOutTiming={0}
        backdropOpacity={0.5}
        hideModalContentWhileAnimating={true}
        isVisible={showFileOptions}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        animationInTiming={300}
        animationOutTiming={300}
        onBackdropPress={() => setShowFileOptions(false)}
      >
        <View style={styles.fileOptionsContainer}>
          <Text style={styles.fileOptionsTitle}>Select Option</Text>

          <TouchableOpacity style={styles.fileOption} onPress={handleCamera}>
            <Text style={styles.fileOptionIcon}>📷</Text>
            <Text style={styles.fileOptionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.fileOption} onPress={handleGallery}>
            <Text style={styles.fileOptionIcon}>📁</Text>
            <Text style={styles.fileOptionText}>Choose from Files</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelOption}
            onPress={() => setShowFileOptions(false)}
          >
            <Text style={styles.cancelOptionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <MessageModal
        isVisible={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
        }}
        message="Task added successfully"
        okLabel="OK"
      />
      {/* Date/Time Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          testID="startDatePicker"
          value={startDate}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onStartDateChange}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          testID="endDatePicker"
          value={endDate}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onEndDateChange}
        />
      )}
      {showStartTimePicker && (
        <DateTimePicker
          testID="startTimePicker"
          value={startTime}
          mode="time"
          // is24Hour={true}
          display="default"
          onChange={onStartTimeChange}
        />
      )}
      {showEndTimePicker && (
        <DateTimePicker
          testID="endTimePicker"
          value={endTime}
          mode="time"
          // is24Hour={true}
          display="default"
          onChange={onEndTimeChange}
        />
      )}
    </View>
  );
};

export default TaskApproval;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.white,
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
    zIndex: 1,
  },
  modalContainer: {
    maxHeight: '90%',
    justifyContent: 'center',
    borderRadius: normalize(8),
    overflow: 'hidden',
  },
  modalScrollContent: {
    padding: normalize(20),
    paddingTop: normalize(40),
  },
  modalTitle: {
    textAlign: 'center',
    fontFamily: Fonts.MulishExtraBold,
    fontSize: 24,
    color: Colors.white,
    marginBottom: normalize(30),
  },
  fieldLabel: {
    textAlign: 'left',
    fontFamily: Fonts.MulishBold,
    fontSize: 16,
    color: Colors.white,
    marginBottom: 5,
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
    width: '100%',
    padding: normalize(10),
    backgroundColor: Colors.white,
    borderRadius: normalize(8),
    marginBottom: normalize(10),
  },
  userTextContainer: {
    width: '100%',
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
    fontFamily: Fonts.MulishRegular,
    fontSize: 16,
    marginTop: 5,
    color: Colors.black,
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
    height: normalize(100),
    width: normalize(80),
    overflow: 'hidden',
  },
  userImage: {
    height: normalize(150),
    width: normalize(110),
  },
  userImagePlaceholder: {
    alignSelf: 'center',
    height: normalize(100),
    width: normalize(80),
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
    marginTop: normalize(20),
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
  placeholderStyle: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: Fonts.MulishRegular,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: Fonts.MulishSemiBold,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    color: Colors.black,
    fontFamily: Fonts.MulishRegular,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  dropdownListContainer: {
    backgroundColor: Colors.greytext,
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
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: 10,
    fontSize: 18,
  },
  // New styles for date/time pickers
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  dateTimeButton: {
    flex: 1,
    height: 50,
    backgroundColor: Colors.white,
    borderColor: '#2494ea',
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 10,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: Fonts.MulishSemiBold,
    textAlign: 'left',
  },

  // File upload styles
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 15,
    elevation: 1,
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  uploadText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#27ae60',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 1,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // File options modal styles
  fileOptionsContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  fileOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  fileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fileOptionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  fileOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  cancelOption: {
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },
  cancelOptionText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#660d03ff',
    fontFamily: Fonts.MulishMedium,
    marginLeft: 10,
  },
});
