/**
 * Hydrology Engine: Single Node Predictor
 * Calculates localized runoff and flood probability for an independent canal mote.
 */

// --- Constants ---
const SECONDS_IN_HOUR = 3600;
const MM_TO_METERS = 0.001;
const STANDARD_SPEED_OF_SOUND = 343.2; // m/s at 20°C (293.15K)

/**
 * Calibrates ultrasonic distance based on ambient temperature.
 * @param {number} rawDistance - The distance measured by the sensor (assuming 20°C calibration).
 * @param {number} tempKelvin - Current ambient temperature in Kelvin.
 * @returns {number} Calibrated distance in meters.
 */
function calibrateUltrasonic(rawDistance, tempKelvin) {
    // Speed of sound formula: c ≈ 20.05 * sqrt(T)
    const actualSpeedOfSound = 20.05 * Math.sqrt(tempKelvin);
    
    // Adjust the distance based on the ratio of actual vs. expected speed of sound
    const calibratedDistance = rawDistance * (actualSpeedOfSound / STANDARD_SPEED_OF_SOUND);
    return Number(calibratedDistance.toFixed(3));
}

/**
 * Main prediction function for a single independent node.
 * 
 * @param {Object} moteConfig - Static configuration for the specific mote (from DB).
 * @param {Object} telemetry - Dynamic data from sensors and weather APIs.
 * @returns {Object} Standardized prediction output for the frontend/GIS layer.
 */
function predictSingleNode(moteConfig, telemetry) {
    // 1. Data Preparation & Calibration
    const calibratedAirGap = calibrateUltrasonic(telemetry.ultrasonicDistance, telemetry.temperature);
    
    // Water height is the total depth of the canal minus the air gap to the water surface
    let actualWaterHeight = moteConfig.canalDepth - calibratedAirGap;
    
    // Guardrail: Prevent negative heights due to sensor noise when empty
    if (actualWaterHeight < 0) actualWaterHeight = 0;

    // 2. Local Runoff Calculation
    // Q = (R * A * C) / 3600 to convert mm/hr to m^3/s
    const rainfallMeters = telemetry.rainfall * MM_TO_METERS;
    const localRunoffVolume = (rainfallMeters * moteConfig.catchmentArea * moteConfig.runoffCoefficient) / SECONDS_IN_HOUR;

    // 3. Flow Rate Calculation
    // Base flow rate from sensor. (In a full hydraulic model, elevation/slope would modify this, 
    // but the sensor gives us the true empirical reading).
    let currentFlowRate = telemetry.flowRate;
    
    // 4. Predictive Additive Logic
    const totalVolumeOut = currentFlowRate + localRunoffVolume;

    // 5. Probability and Risk Assessment
    let floodProbability = (totalVolumeOut / moteConfig.maxRatedFlow) * 100;
    
    // Cap probability at 100% for the UI, though mathematically it can exceed it during a flood
    if (floodProbability > 100) floodProbability = 100;

    let riskLevel = "Green";
    if (floodProbability >= 85) {
        riskLevel = "Red";
    } else if (floodProbability >= 50) {
        riskLevel = "Yellow";
    }

    // 6. Construct the Output Object
    return {
        moteId: moteConfig.moteId,
        coordinates: moteConfig.coordinates,
        elevation: moteConfig.elevation,
        metrics: {
            waterHeight: Number(actualWaterHeight.toFixed(2)),
            flowRate: Number(currentFlowRate.toFixed(3)),
            localRunoff: Number(localRunoffVolume.toFixed(3)),
            temperatureK: telemetry.temperature
        },
        prediction: {
            totalVolumeOut: Number(totalVolumeOut.toFixed(3)),
            floodProbability: Number(floodProbability.toFixed(1)),
            riskLevel: riskLevel
        }
    };
}

module.exports = { predictSingleNode, calibrateUltrasonic };