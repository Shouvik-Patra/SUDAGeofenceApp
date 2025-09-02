import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Header from '../../components/Header';
import { Colors, Fonts, Images } from '../../themes/ThemePath';
import normalize from '../../utils/helpers/normalize';
import showErrorAlert from '../../utils/helpers/Toast';
import { StackActions, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { logoutRequest } from '../../redux/reducer/AuthReducer';
import {
  profileUpdateRequest,
  userDetailsRequest,
} from '../../redux/reducer/ProfileReducer';
import connectionrequest from '../../utils/helpers/NetInfo';
import Loader from '../../utils/helpers/Loader';
import TextInputWithButton from '../../components/TextInputWithBotton';
let status = '';
const ProfileMuRegister = props => {
  const dispatch = useDispatch();
  const AuthReducer = useSelector(state => state.AuthReducer);
  const ProfileReducer = useSelector(state => state.ProfileReducer);

  const isFocused = useIsFocused();
  const [name, setName] = useState(
    ProfileReducer?.userDetailsResponse?.name
      ? ProfileReducer?.userDetailsResponse?.name
      : '',
  );
  const [email, setEmail] = useState(
    ProfileReducer?.userDetailsResponse?.email
      ? ProfileReducer?.userDetailsResponse?.email
      : '',
  );
  const [phone, setPhone] = useState(
    ProfileReducer?.userDetailsResponse?.phone
      ? ProfileReducer?.userDetailsResponse?.phone
      : '',
  );
  const [address, setAddress] = useState(
    ProfileReducer?.userDetailsResponse?.address
      ? ProfileReducer?.userDetailsResponse?.phone
      : '',
  );
  const [isEditing, setIsEditing] = useState(
    props?.route?.params?.isEditing || false,
  );
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    profilePicture: Images.profilepic,
    name: ProfileReducer?.userDetailsResponse?.name
      ? ProfileReducer?.userDetailsResponse?.name
      : '',
    dob: '1995-11-11',
    doj: '2020-03-01',
    address: 'Uttar Rajyadharpur, Hooghly',
    phoneNumber: '8961700942',
  });
  const [capturedImageWithGeotag, setCapturedImageWithGeotag] = useState(
    ProfileReducer?.userDetailsResponse?.photo
      ? ProfileReducer?.userDetailsResponse?.photo
      : null,
  );
  console.log('capturedImageWithGeotag>>', capturedImageWithGeotag);

  const [editedProfile, setEditedProfile] = useState({ ...profile });
  // Listen for the returned image from Attendance page
  useEffect(() => {
    if (props?.route?.params?.finalImageUri) {
      setCapturedImageWithGeotag(props.route.params.finalImageUri);
      // Clear the parameter to avoid re-triggering
      props?.navigation.setParams({ finalImageUri: undefined });

      // Show success message
      // showErrorAlert('Success', 'Photo captured with geotag successfully!');
    }
  }, [props?.route?.params?.finalImageUri]);
  const handleEdit = () => {
    // setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    // setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleClickPhoto = () => {
    console.log('heloo');

    props?.navigation.navigate('Attendence', {
      pagename: 'ProfileMuRegister',
    });
  };

  function onUpdateProfile() {
    const imageName = capturedImageWithGeotag?.split('/').pop(); // extract file name
    const imageType = 'image/jpeg'; // or dynamically detect

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('address', address);
    formData.append('photo', {
      uri:
        Platform.OS === 'android'
          ? capturedImageWithGeotag
          : capturedImageWithGeotag?.replace('file://', ''),
      name: imageName,
      type: imageType,
    });

    connectionrequest()
      .then(() => {
        dispatch(profileUpdateRequest(formData));
      })
      .catch(err => {
        console.log(err);
        showErrorAlert('Please connect to internet');
      });
  }
  function userDetails() {
    connectionrequest()
      .then(() => {
        dispatch(userDetailsRequest());
      })
      .catch(err => {
        console.log(err);
        showErrorAlert('Please connect to internet');
      });
  }

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

      case 'Profile/profileUpdateRequest':
        status = ProfileReducer.status;
        setLoading(true);
        break;
      case 'Profile/profileUpdateSuccess':
        status = ProfileReducer.status;
        setLoading(false);
        userDetails();
        break;
      case 'Profile/profileUpdateFailure':
        status = ProfileReducer.status;
        setLoading(false);
        break;
    }
  }
  // const ProfileField = ({
  //   label,
  //   value,
  //   editable = true,
  //   multiline = false,
  //   onChangeText,
  // }) => (
  //   <View style={styles.fieldContainer}>
  //     <Text style={styles.fieldLabel}>{label}</Text>
  //     {isEditing && editable ? (
  //       <TextInput
  //         style={[styles.input, multiline && styles.multilineInput]}
  //         value={value}
  //         onChangeText={onChangeText}
  //         multiline={multiline}
  //         numberOfLines={multiline ? 3 : 1}
  //       />
  //     ) : (
  //       <Text style={[styles.fieldValue, !editable && styles.nonEditableField]}>
  //         {label.includes('Date') ? formatDate(value) : value}
  //       </Text>
  //     )}
  //   </View>
  // );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Header
        HeaderLogo
        Title
        placeText={'My Profile'}
        onPress_back_button={() => {
          setModalVisible(true);
        }}
        onPress_right_button={() => {
          props.navigation.navigate('Notification');
        }}
      />
      <Loader visible={loading} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            resizeMode="contain"
            style={styles.profileImage}
            source={Images.wb_logo}
          />
          <Text style={styles.headerName}>
            {ProfileReducer?.userDetailsResponse?.name
              ? ProfileReducer?.userDetailsResponse?.name
              : ''}{' '}
            municipality
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.fieldValue}>{name}</Text>
          <Text style={styles.fieldValue}>{phone}</Text>
          <Text style={styles.fieldValue}>{email}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.editButton,
              { marginTop: normalize(10), backgroundColor: Colors.orange },
            ]}
            onPress={() => {
              dispatch(logoutRequest());
            }}
          >
            <Text style={styles.editButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495e',
    width: '100%',
    paddingBottom: normalize(60),
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#34495e',
    width: '100%',
  },
  scrollViewContent: {
    // paddingHorizontal: normalize(10),
    // paddingVertical: normalize(10),
    paddingBottom: normalize(100), // Extra padding at bottom
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
  },
  editImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    textTransform: 'capitalize',
  },
  content: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 15,
  },
  nonEditableField: {
    backgroundColor: '#f0f0f0',
    color: '#888',
  },
  input: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    padding: 20,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileMuRegister;
