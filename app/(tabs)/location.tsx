import React, { useState, useRef } from 'react';
import { StyleSheet, ScrollView, View, Dimensions, ActivityIndicator, Image, Modal, TouchableOpacity, Pressable } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, PrimaryBlue, SuccessGreen, Gray50, Gray100, Gray900, White } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveParkingSession, useParkingSessions } from '@/hooks/useParkingSessions';
import { useParkingLot } from '@/hooks/useParkingLot';

const { width } = Dimensions.get('window');

export default function LocationScreen() {
  const colors = Colors['light'];
  const { user } = useAuth();
  const { activeSession, isLoading: isLoadingActive } = useActiveParkingSession();
  const { sessions: activeSessions, isLoading: isLoadingActiveSessions } = useParkingSessions('active');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [modalMapUrl, setModalMapUrl] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Determine which active session to show (support multiple vehicles)
  const displayedSession = React.useMemo(() => {
    if (selectedSessionId && activeSessions.length > 0) {
      const found = activeSessions.find(s => s.id === selectedSessionId);
      if (found) return found;
    }
    if (activeSessions.length > 0) {
      return activeSessions[0];
    }
    if (activeSession) {
      return {
        id: activeSession.session.id,
        vehicleId: activeSession.vehicle.id,
        licensePlate: activeSession.session.licensePlate,
        parkingSlotId: activeSession.parkingSlot.id,
        entryTime: activeSession.session.entryTime,
        exitTime: null,
        fee: null,
        status: 'active' as const,
        vehicle: activeSession.vehicle,
        parkingSlot: {
          id: activeSession.parkingSlot.id,
          slotNumber: activeSession.parkingSlot.slotCode,
          slot_code: activeSession.parkingSlot.slotCode,
          status: activeSession.parkingSlot.status,
          parkingLot: activeSession.parkingLot,
        },
      };
    }
    return null;
  }, [selectedSessionId, activeSessions, activeSession]);

  // Set default selected session when list changes
  React.useEffect(() => {
    if (activeSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(activeSessions[0].id);
    } else if (activeSessions.length === 0 && activeSession) {
      setSelectedSessionId(null);
    }
  }, [activeSessions, activeSession, selectedSessionId]);

  const parkingLotId = displayedSession?.parkingSlot?.parkingLot?.id || null;
  const { parkingLot, isLoading: isLoadingParkingLot, refetch: refetchParkingLot } = useParkingLot(parkingLotId);

  // Store map URL when modal opens
  React.useEffect(() => {
    if (isMapModalVisible) {
      if (parkingLot?.map) {
        setModalMapUrl(parkingLot.map);
      } else if (parkingLotId) {
        // If map not loaded, try to fetch
        refetchParkingLot();
      }
    } else {
      // Reset when modal closes
      setModalMapUrl(null);
    }
  }, [isMapModalVisible, parkingLot?.map, parkingLotId, refetchParkingLot]);
  
  // Update modal map URL when parkingLot changes
  React.useEffect(() => {
    if (isMapModalVisible && parkingLot?.map) {
      setModalMapUrl(parkingLot.map);
    }
  }, [parkingLot?.map, isMapModalVisible]);

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return { time, date: dateStr };
  };

  // Calculate duration
  const calculateDuration = (entryTime: string, exitTime: string | null) => {
    const entry = new Date(entryTime);
    const exit = exitTime ? new Date(exitTime) : new Date();
    const diffMs = exit.getTime() - entry.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours} giờ ${diffMinutes > 0 ? diffMinutes + ' phút' : ''}`;
    }
    return `${diffMinutes} phút`;
  };

  // Parse slot number to extract zone and spot
  const parseSlotNumber = (slotNumber: string | undefined | null) => {
    // Format: "A-05" or "A-12"
    if (!slotNumber || typeof slotNumber !== 'string') {
      return {
        zone: 'N/A',
        spot: 'N/A',
        full: slotNumber || '',
      };
    }
    const parts = slotNumber.split('-');
    return {
      zone: parts[0] || 'N/A',
      spot: parts[1] || 'N/A',
      full: slotNumber,
    };
  };

  // Calculate center point from polygon coordinates
  const getPolygonCenter = (coordinates: number[][][]): { x: number; y: number } | null => {
    if (!coordinates || coordinates.length === 0 || !coordinates[0] || coordinates[0].length === 0) {
      return null;
    }
    const points = coordinates[0]; // Get first polygon
    if (points.length < 3) return null;
    
    // Calculate centroid
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    
    // Skip last point if it's the same as first (closed polygon)
    const endIndex = points.length > 0 && 
                     points[0][0] === points[points.length - 1][0] && 
                     points[0][1] === points[points.length - 1][1]
                     ? points.length - 1 
                     : points.length;
    
    for (let i = 0; i < endIndex; i++) {
      sumX += points[i][0];
      sumY += points[i][1];
      count++;
    }
    
    if (count === 0) return null;
    
    return {
      x: sumX / count,
      y: sumY / count,
    };
  };

  // Scale polygon coordinates from original image size to displayed size
  const scalePolygonCoordinates = (
    coordinates: number[][][],
    originalWidth: number,
    originalHeight: number,
    displayWidth: number,
    displayHeight: number
  ): string => {
    if (!coordinates || coordinates.length === 0 || !coordinates[0]) {
      return '';
    }
    
    const points = coordinates[0];
    const scaleX = displayWidth / originalWidth;
    const scaleY = displayHeight / originalHeight;
    
    return points
      .map(([x, y]) => `${x * scaleX},${y * scaleY}`)
      .join(' ');
  };

  const parkingInfo = displayedSession
    ? {
        isParked: true,
        location: displayedSession.parkingSlot.slotNumber || displayedSession.parkingSlot.slot_code || '',
        ...parseSlotNumber(displayedSession.parkingSlot.slotNumber || displayedSession.parkingSlot.slot_code),
        floor: 'Tầng 1', // API không có floor info, có thể thêm sau
        startTime: formatDateTime(displayedSession.entryTime).time,
        date: formatDateTime(displayedSession.entryTime).date,
        duration: calculateDuration(displayedSession.entryTime, displayedSession.exitTime),
        coordinates: (displayedSession as any).parkingSlot.coordinates || activeSession?.parkingSlot.coordinates || null,
        polygonCenter: getPolygonCenter((displayedSession as any).parkingSlot.coordinates || activeSession?.parkingSlot.coordinates || null),
        licensePlate: displayedSession.licensePlate || displayedSession.vehicle?.licensePlate,
        parkingLotName: displayedSession.parkingSlot.parkingLot.name,
      }
    : {
        isParked: false,
        location: '',
        zone: '',
        spot: '',
        floor: '',
        startTime: '',
        date: '',
        duration: '',
        coordinates: null,
        polygonCenter: null,
      };

  // Calculate image display dimensions
  const calculateImageSize = (originalWidth: number, originalHeight: number) => {
    const maxWidth = width - 80; // Account for padding
    const maxHeight = 400; // Max height for map
    
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);
    
    return {
      width: originalWidth * ratio,
      height: originalHeight * ratio,
      ratio,
    };
  };

  // Handle image load to get dimensions
  React.useEffect(() => {
    if (parkingLot?.map) {
      Image.getSize(
        parkingLot.map,
        (width, height) => {
          setImageDimensions({ width, height });
        },
        (error) => {
          console.error('Error getting image size:', error);
        }
      );
    }
  }, [parkingLot?.map]);

  if (isLoadingActive || isLoadingActiveSessions || isLoadingParkingLot) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
          <ThemedText style={styles.loadingText}>Đang tải...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!parkingInfo.isParked) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>Vị trí xe đang đỗ</ThemedText>
          </ThemedView>
          <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="car.fill" size={80} color={colors.icon} />
            <ThemedText type="subtitle" style={styles.emptyText}>
              Hiện tại không có xe đang đỗ
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Bạn chưa có lượt đỗ xe nào đang hoạt động
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>Vị trí xe đang đỗ</ThemedText>
          </ThemedView>

          {/* Vehicle Selector when multiple active sessions */}
          {activeSessions.length > 1 && (
            <ThemedView style={styles.selectorContainer}>
              <ThemedText style={styles.selectorLabel}>Chọn xe đang đỗ:</ThemedText>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowVehicleSelector(true)}>
                <ThemedView style={styles.selectorButtonContent}>
                  <IconSymbol name="car.fill" size={20} color={PrimaryBlue} />
                  <ThemedText type="defaultSemiBold" style={styles.selectorButtonText}>
                    {parkingInfo.licensePlate}
                  </ThemedText>
                  <IconSymbol name="chevron.down" size={18} color="#9CA3AF" />
                </ThemedView>
              </TouchableOpacity>
            </ThemedView>
          )}

          {/* Current Parking Info */}
          <ThemedView style={styles.infoCard}>
            <ThemedView style={styles.infoHeader}>
              <IconSymbol name="location.fill" size={28} color={SuccessGreen} />
              <ThemedText type="subtitle" style={styles.infoTitle}>
                Thông tin đỗ xe
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoDetails}>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Địa điểm:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                  {parkingInfo.parkingLotName || 'N/A'}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Vị trí:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                  {parkingInfo.location || 'N/A'}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Biển số xe:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                  {parkingInfo.licensePlate || 'N/A'}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Bắt đầu:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                  {parkingInfo.startTime} - {parkingInfo.date}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Thời gian:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                  {parkingInfo.duration}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Parking Lot Map */}
          <ThemedView style={styles.mapContainer}>
            <ThemedText type="subtitle" style={styles.mapTitle}>
              Sơ đồ bãi đỗ xe
            </ThemedText>
            <ThemedView style={styles.mapCard}>
              {parkingLot?.map ? (
                <Pressable 
                  style={styles.mapImageContainer}
                  onPress={() => setIsMapModalVisible(true)}>
                  {imageDimensions && (() => {
                    const displaySize = calculateImageSize(imageDimensions.width, imageDimensions.height);
                    const polygonPoints = parkingInfo.coordinates
                      ? scalePolygonCoordinates(
                          parkingInfo.coordinates,
                          imageDimensions.width,
                          imageDimensions.height,
                          displaySize.width,
                          displaySize.height
                        )
                      : '';
                    
                    return (
                      <View style={{ width: displaySize.width, height: displaySize.height, position: 'relative' }}>
                        <Image
                          source={{ uri: parkingLot.map }}
                          style={[
                            styles.mapImage,
                            { width: displaySize.width, height: displaySize.height },
                          ]}
                          resizeMode="contain"
                        />
                        {polygonPoints && (
                          <Svg
                            style={StyleSheet.absoluteFill}
                            width={displaySize.width}
                            height={displaySize.height}>
                            <Polygon
                              points={polygonPoints}
                              fill="rgba(34, 197, 94, 0.2)"
                              stroke={SuccessGreen}
                              strokeWidth="2"
                            />
                          </Svg>
                        )}
                        {parkingInfo.polygonCenter && parkingInfo.polygonCenter.x >= 0 && parkingInfo.polygonCenter.y >= 0 && (() => {
                          // Scale center point from original image to displayed size
                          const scaleX = displaySize.width / imageDimensions.width;
                          const scaleY = displaySize.height / imageDimensions.height;
                          const markerX = parkingInfo.polygonCenter.x * scaleX;
                          const markerY = parkingInfo.polygonCenter.y * scaleY;
                          return (
                            <View
                              style={[
                                styles.parkingSpotMarker,
                                {
                                  left: markerX,
                                  top: markerY,
                                },
                              ]}>
                              <IconSymbol name="location.fill" size={24} color={SuccessGreen} />
                              <View style={styles.markerPulse} />
                            </View>
                          );
                        })()}
                      </View>
                    );
                  })()}
                  {!imageDimensions && (
                    <ActivityIndicator size="large" color={PrimaryBlue} />
                  )}
                </Pressable>
              ) : (
                <ThemedView style={styles.mapPlaceholder}>
                  <ActivityIndicator size="large" color={PrimaryBlue} />
                  <ThemedText style={styles.mapPlaceholderText}>Đang tải bản đồ...</ThemedText>
                </ThemedView>
              )}
              <ThemedView style={styles.mapLegend}>
                <Pressable 
                  onPress={() => setIsMapModalVisible(true)}
                  style={styles.legendItem}>
                  <IconSymbol name="location.fill" size={16} color={SuccessGreen} />
                  <ThemedText style={styles.legendText}>Vị trí xe của bạn (Nhấn để xem lớn)</ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Directions */}
          <ThemedView style={styles.directionsCard}>
            <IconSymbol name="arrow.turn.up.right" size={24} color={PrimaryBlue} />
            <ThemedView style={styles.directionsContent}>
              <ThemedText type="defaultSemiBold" style={styles.directionsTitle}>
                Hướng dẫn đường đi
              </ThemedText>
              <ThemedText style={styles.directionsText}>
                Từ cửa vào, đi thẳng 50m, rẽ trái vào khu vực A, xe của bạn đang đỗ ở vị trí 12, tầng 1.
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </ThemedView>

      {/* Vehicle Selector Modal */}
      <Modal
        visible={showVehicleSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVehicleSelector(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowVehicleSelector(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Chọn xe đang đỗ
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowVehicleSelector(false)}
                style={styles.modalCloseButton}>
                <IconSymbol name="xmark.circle.fill" size={24} color={Gray900} />
              </TouchableOpacity>
            </ThemedView>
            <ScrollView style={styles.modalBody}>
              {activeSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.modalVehicleItem,
                    selectedSessionId === session.id && styles.modalVehicleItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedSessionId(session.id);
                    setShowVehicleSelector(false);
                  }}>
                  <ThemedView style={styles.modalVehicleLeft}>
                    <ThemedView style={styles.modalVehicleIconContainer}>
                      <IconSymbol name="car.fill" size={20} color={PrimaryBlue} />
                    </ThemedView>
                    <ThemedView>
                      <ThemedText type="defaultSemiBold" style={styles.modalVehiclePlate}>
                        {session.licensePlate || session.vehicle.licensePlate}
                      </ThemedText>
                      <ThemedText style={styles.modalVehicleType}>
                        {session.parkingSlot.parkingLot.name}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  {selectedSessionId === session.id && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={PrimaryBlue} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Fullscreen Map Modal with Zoom */}
      <Modal
        visible={isMapModalVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsMapModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <ThemedText type="title" style={styles.modalTitle}>Sơ đồ bãi đỗ xe</ThemedText>
            <TouchableOpacity
              onPress={() => setIsMapModalVisible(false)}
              style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={32} color={Gray900} />
            </TouchableOpacity>
          </View>
          {(() => {
            const mapUrl = modalMapUrl || parkingLot?.map;
            
            if (!mapUrl) {
              return (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color={PrimaryBlue} />
                  <ThemedText style={styles.modalLoadingText}>
                    {isLoadingParkingLot ? 'Đang tải bản đồ...' : 'Không tìm thấy bản đồ'}
                  </ThemedText>
                </View>
              );
            }

            const screenWidth = Dimensions.get('window').width;
            const screenHeight = Dimensions.get('window').height - 100;
            
            // Use imageDimensions if available, otherwise use screen dimensions as fallback
            let displayWidth = screenWidth;
            let displayHeight = screenHeight;
            let polygonPoints = '';
            let markerScaleX = 1;
            let markerScaleY = 1;
            
            if (imageDimensions) {
              const imageAspectRatio = imageDimensions.width / imageDimensions.height;
              const screenAspectRatio = screenWidth / screenHeight;
              
              if (imageAspectRatio > screenAspectRatio) {
                displayHeight = screenWidth / imageAspectRatio;
              } else {
                displayWidth = screenHeight * imageAspectRatio;
              }
              
              polygonPoints = parkingInfo.coordinates
                ? scalePolygonCoordinates(
                    parkingInfo.coordinates,
                    imageDimensions.width,
                    imageDimensions.height,
                    displayWidth,
                    displayHeight
                  )
                : '';
              
              markerScaleX = displayWidth / imageDimensions.width;
              markerScaleY = displayHeight / imageDimensions.height;
            }
            
            return (
              <ScrollView
                ref={scrollViewRef}
                style={styles.modalScrollView}
                contentContainerStyle={{
                  width: Math.max(displayWidth * 5, screenWidth),
                  height: Math.max(displayHeight * 5, screenHeight),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                maximumZoomScale={5}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={true}
                showsVerticalScrollIndicator={true}
                bouncesZoom={true}
                scrollEnabled={true}
                centerContent={true}>
                <View
                  style={{
                    width: displayWidth,
                    height: displayHeight,
                    position: 'relative',
                  }}>
                  <Image
                    source={{ uri: mapUrl }}
                    style={{
                      width: displayWidth,
                      height: displayHeight,
                    }}
                    resizeMode="contain"
                    onLoad={(e) => {
                      // Get image dimensions when image loads
                      if (!imageDimensions && e.nativeEvent.source?.width && e.nativeEvent.source?.height) {
                        setImageDimensions({
                          width: e.nativeEvent.source.width,
                          height: e.nativeEvent.source.height,
                        });
                      }
                    }}
                  />
                  {polygonPoints && (
                    <Svg
                      style={StyleSheet.absoluteFill}
                      width={displayWidth}
                      height={displayHeight}>
                      <Polygon
                        points={polygonPoints}
                        fill="rgba(34, 197, 94, 0.2)"
                        stroke={SuccessGreen}
                        strokeWidth="3"
                      />
                    </Svg>
                  )}
                  {parkingInfo.polygonCenter && imageDimensions && (
                    <View
                      style={[
                        styles.modalMarker,
                        {
                          left: parkingInfo.polygonCenter.x * markerScaleX,
                          top: parkingInfo.polygonCenter.y * markerScaleY,
                        },
                      ]}>
                      <IconSymbol name="location.fill" size={32} color={SuccessGreen} />
                      <View style={styles.modalMarkerPulse} />
                    </View>
                  )}
                </View>
              </ScrollView>
            );
          })()}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Gray50,
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    color: Gray900,
    fontSize: 28,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 20,
    marginBottom: 10,
    color: Gray900,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#6B7280',
  },
  infoCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: White,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Gray900,
  },
  infoDetails: {
    gap: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    color: Gray900,
    fontWeight: '600',
  },
  mapContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mapTitle: {
    marginBottom: 15,
    fontSize: 18,
    fontWeight: '600',
    color: Gray900,
  },
  mapCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: White,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0,
  },
  mapImageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    minHeight: 200,
  },
  mapImage: {
    width: '100%',
    maxWidth: width - 80,
  },
  mapPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapPlaceholderText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  parkingSpotMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  markerPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SuccessGreen,
    opacity: 0.3,
    transform: [{ scale: 2 }],
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 14,
    color: Gray900,
  },
  directionsCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: White,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0,
    flexDirection: 'row',
    gap: 15,
  },
  directionsContent: {
    flex: 1,
  },
  directionsTitle: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Gray900,
  },
  directionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: White,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Gray100,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Gray900,
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Dimensions.get('window').height - 100,
  },
  modalImageContainer: {
    position: 'relative',
  },
  modalImage: {
    // Image size will be set dynamically
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  modalMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  modalMarkerPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SuccessGreen,
    opacity: 0.3,
    transform: [{ scale: 2 }],
  },
  selectorContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Gray900,
    marginBottom: 8,
  },
  selectorButton: {
    backgroundColor: White,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Gray100,
  },
  selectorButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorButtonText: {
    flex: 1,
    fontSize: 16,
    color: Gray900,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: White,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalBody: {
    padding: 20,
  },
  modalVehicleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: Gray50,
    borderWidth: 1,
    borderColor: Gray100,
  },
  modalVehicleItemSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: PrimaryBlue,
    borderWidth: 2,
  },
  modalVehicleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalVehicleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalVehiclePlate: {
    fontSize: 16,
    fontWeight: '600',
    color: Gray900,
    marginBottom: 4,
  },
  modalVehicleType: {
    fontSize: 14,
    color: '#6B7280',
  },
});
