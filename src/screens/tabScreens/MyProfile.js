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
import connectionrequest from '../../utils/helpers/NetInfo';
import Loader from '../../utils/helpers/Loader';
let status = '';
const MyProfile = props => {
  const dispatch = useDispatch();
  const AuthReducer = useSelector(state => state.AuthReducer);
  const ProfileReducer = useSelector(state => state.ProfileReducer);
  const userDetails = ProfileReducer?.userDetailsResponse;

  const isFocused = useIsFocused();
  const [name, setName] = useState(userDetails?.name);
  const [phone, setPhone] = useState(userDetails?.municipality_name);


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
      {/* <Loader visible={loading} /> */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image source={Images.wblogo} resizeMode='contain' style={{height:150,width:100}}/>
          <Text style={styles.headerName}>
            {ProfileReducer?.userDetailsResponse?.municipality_name
              ? ProfileReducer?.userDetailsResponse?.municipality_name
              : ''}
          </Text>
         
        </View>

        <View style={styles.content}>
          <Text style={styles.fieldValue}>{name}</Text>
          <Text style={styles.fieldValue}>{phone}</Text>
          <Text style={styles.fieldValue}>{ProfileReducer?.userDetailsResponse?.district_name
              ? ProfileReducer?.userDetailsResponse?.district_name
              : ''}</Text>
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
    // backgroundColor: '#fff',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
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

export default MyProfile;
