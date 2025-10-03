import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import Header from '../../components/Header';
import { useDispatch, useSelector } from 'react-redux';
import { Images } from '../../themes/ThemePath';
import connectionrequest from '../../utils/helpers/NetInfo';
import showErrorAlert from '../../utils/helpers/Toast';
import { useIsFocused } from '@react-navigation/native';
import { geofencedArealistRequest } from '../../redux/reducer/ProfileReducer';

const GeofencedAreaList = props => {
  const AuthReducer = useSelector(state => state.AuthReducer);
  const ProfileReducer = useSelector(state => state.ProfileReducer);
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);

  function getgeoFencedAreaList() {
    setLoading(true);
    connectionrequest()
      .then(() => {
        dispatch(geofencedArealistRequest());
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
        showErrorAlert('Please connect to internet');
      });
  }

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Geofenced Area',
      `Are you sure you want to delete "${item.park_name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Dispatch your delete action here
            console.log('Deleting item with id:', item.id);
            // dispatch(deleteGeofencedAreaRequest(item.id));
          },
        },
      ],
    );
  };

  const renderGeofenceCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.parkName}>{item.park_name}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'active' ? '#4CAF50' : '#F44336' }
          ]}>
            <Text style={styles.statusBadgeText}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ID:</Text>
          <Text style={styles.infoValue}>{item.id}</Text>
        </View>
        {/* <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>{item.geofence_type}</Text>
        </View> */}
      </View>

      <View style={styles.locationSection}>
        <Text style={styles.sectionTitle}>📍 Location</Text>
        <View style={styles.coordinateRow}>
          <Text style={styles.coordinateLabel}>Latitude:</Text>
          <Text style={styles.coordinateValue}>{item.latitude}</Text>
        </View>
        <View style={styles.coordinateRow}>
          <Text style={styles.coordinateLabel}>Longitude:</Text>
          <Text style={styles.coordinateValue}>{item.longitude}</Text>
        </View>
        <View style={styles.coordinateRow}>
          <Text style={styles.coordinateLabel}>Radius:</Text>
          <Text style={styles.coordinateValue}>{item.radius_meters}m</Text>
        </View>
      </View>

      <View style={styles.adminSection}>
        <Text style={styles.sectionTitle}>🏛️ Administrative Area</Text>
        <View style={styles.coordinateRow}>
          <Text style={styles.coordinateLabel}>District:</Text>
          <Text style={styles.coordinateValue}>{item.district_name}</Text>
        </View>
        <View style={styles.coordinateRow}>
          <Text style={styles.coordinateLabel}>Municipality:</Text>
          <Text style={styles.coordinateValue}>{item.municipality_name}</Text>
        </View>
      </View>

      <View style={styles.timestampSection}>
        <Text style={styles.timestampText}>
          Created: {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  useEffect(() => {
    getgeoFencedAreaList();
  }, [isFocused]);

  // Get the geofenced areas from your reducer
  const geofencedAreas = ProfileReducer?.geofencedArealistResponse || [];

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
        onPress_back_button={() => props.navigation.goBack()}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Geofenced Areas</Text>
          <Text style={styles.subtitle}>
            Total: {geofencedAreas.length} areas
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading geofenced areas...</Text>
          </View>
        ) : (
          <FlatList
            data={geofencedAreas}
            renderItem={renderGeofenceCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No geofenced areas found</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ImageBackground>
  );
};

export default GeofencedAreaList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 15,
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
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  parkName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    fontSize: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginRight: 5,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  locationSection: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  adminSection: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  coordinateLabel: {
    fontSize: 13,
    color: '#666',
  },
  coordinateValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  timestampSection: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 8,
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});