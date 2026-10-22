/**
 * Haversine formula for calculating spherical distance between two points on Earth in metres.
 * Formula:
 *   a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 *   c = 2 ⋅ atan2( √a, √(1−a) )
 *   d = R ⋅ c
 *   where R = 6,371,000 metres (mean Earth radius)
 */

export const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates distance in metres between (lat1, lng1) and (lat2, lng2).
 * @param {number} lat1 Latitude of point 1
 * @param {number} lng1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lng2 Longitude of point 2
 * @returns {number} Distance in metres
 */
export function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lng1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lng2 !== 'number'
  ) {
    throw new Error('Invalid coordinates: all latitude and longitude parameters must be numbers');
  }

  const toRad = (angle) => (angle * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lng2 - lng1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 10) / 10; // Round to 1 decimal place
}

/**
 * Evaluates student device location against classroom geofencing rules.
 *
 * Rules:
 * 1. Permission Denied -> FLAGGED_FOR_REVIEW ('PERMISSION_DENIED')
 * 2. Accuracy too poor (> maxAccuracy) -> FLAGGED_FOR_REVIEW ('INCONCLUSIVE_ACCURACY')
 * 3. Inside radius (distance <= radius) and acceptable accuracy -> VERIFIED ('WITHIN_RADIUS') -> Present
 * 4. Outside radius (distance > radius) -> FLAGGED_FOR_REVIEW ('OUT_OF_RADIUS')
 *
 * @param {Object} studentLocation { lat, lng, accuracy, permission }
 * @param {Object} classroomGeofence { lat, lng, radiusMeters, maxAccuracyMeters }
 * @returns {Object} evaluation outcome
 */
export function evaluateClassroomLocation(studentLocation, classroomGeofence) {
  const { lat: sLat, lng: sLng, accuracy, permission } = studentLocation || {};
  const {
    lat: cLat,
    lng: cLng,
    radiusMeters = 50,
    maxAccuracyMeters = 35,
    name: classroomName = 'Configured Classroom',
  } = classroomGeofence || {};

  // Case 1: Permission explicitly denied or unavailable
  if (permission === 'DENIED' || permission === 'UNAVAILABLE' || permission === 'TIMEOUT') {
    return {
      locationVerification: 'PERMISSION_DENIED',
      verificationStatus: 'FLAGGED_FOR_REVIEW',
      attendanceStatus: 'FLAGGED_FOR_REVIEW',
      distanceMeters: null,
      accuracyMeters: null,
      verificationResult: 'Location permission denied by student device',
      flagReason: 'Student did not grant GPS location access. Manual teacher verification required.',
    };
  }

  // Case 2: Missing coordinates
  if (sLat == null || sLng == null) {
    return {
      locationVerification: 'PERMISSION_DENIED',
      verificationStatus: 'FLAGGED_FOR_REVIEW',
      attendanceStatus: 'FLAGGED_FOR_REVIEW',
      distanceMeters: null,
      accuracyMeters: null,
      verificationResult: 'No GPS coordinates supplied',
      flagReason: 'No GPS coordinates received from device. Manual check-in required.',
    };
  }

  // Calculate Haversine distance
  const distance = calculateHaversineDistance(sLat, sLng, cLat, cLng);
  const reportedAccuracy = typeof accuracy === 'number' ? Math.round(accuracy) : null;

  // Case 3: GPS accuracy exceeds acceptable threshold
  if (reportedAccuracy != null && reportedAccuracy > maxAccuracyMeters) {
    return {
      locationVerification: 'INCONCLUSIVE_ACCURACY',
      verificationStatus: 'FLAGGED_FOR_REVIEW',
      attendanceStatus: 'FLAGGED_FOR_REVIEW',
      distanceMeters: distance,
      accuracyMeters: reportedAccuracy,
      verificationResult: `Inconclusive: GPS accuracy is too low (${reportedAccuracy}m > tolerance ${maxAccuracyMeters}m)`,
      flagReason: `Device GPS accuracy (${reportedAccuracy}m) exceeds acceptable classroom limit of ${maxAccuracyMeters}m. Possible indoor interference.`,
    };
  }

  // Case 4: Within configured radius
  if (distance <= radiusMeters) {
    return {
      locationVerification: 'WITHIN_RADIUS',
      verificationStatus: 'VERIFIED',
      attendanceStatus: 'PRESENT',
      distanceMeters: distance,
      accuracyMeters: reportedAccuracy,
      verificationResult: `Within configured radius (${distance}m <= ${radiusMeters}m)`,
      flagReason: null,
    };
  }

  // Case 5: Outside configured radius
  return {
    locationVerification: 'OUT_OF_RADIUS',
    verificationStatus: 'FLAGGED_FOR_REVIEW',
    attendanceStatus: 'FLAGGED_FOR_REVIEW',
    distanceMeters: distance,
    accuracyMeters: reportedAccuracy,
    verificationResult: `Outside configured radius (${distance}m > ${radiusMeters}m)`,
    flagReason: `Student device is located ${distance}m away from ${classroomName}, exceeding the ${radiusMeters}m classroom perimeter.`,
  };
}
