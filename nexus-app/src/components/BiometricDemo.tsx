import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export default function BiometricDemo() {
  const [isCompatible, setIsCompatible] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Check biometric hardware capabilities on mount
  useEffect(() => {
    async function checkDeviceSupport() {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      setIsCompatible(hasHardware);
      setIsEnrolled(enrolled);
    }
    checkDeviceSupport();
  }, []);

  // 2. Trigger biometric authentication
  const handleAuthenticate = async () => {
    if (!isCompatible) {
      Alert.alert("Error", "Your device does not support biometric hardware.");
      return;
    }

    if (!isEnrolled) {
      Alert.alert(
        "Error",
        "No biometrics registered. Please configure Fingerprint/FaceID in your device settings.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm Remote PC Shutdown", // Title displayed in prompt
        fallbackLabel: "Use Device Passcode", // Fallback option
        disableDeviceFallback: false, // Allow PIN/Passcode fallback
        cancelLabel: "Cancel",
      });

      if (result.success) {
        Alert.alert(
          "Success",
          "Biometric verification successful! Sending shutdown command...",
        );
        // Here you would fire the WebSocket/API request to your backend:
        // sendShutdownCommand();
      } else {
        // Handle cancellation or failures (result.error holds error code)
        if (
          result.error !== "user_cancel" &&
          result.error !== "system_cancel"
        ) {
          Alert.alert("Authentication Failed", `Error code: ${result.error}`);
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Biometric Lock Demo</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Hardware Compatible: {isCompatible ? "✅ Yes" : "❌ No"}
        </Text>
        <Text style={styles.infoText}>
          Biometrics Enrolled: {isEnrolled ? "✅ Yes" : "❌ No"}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!isCompatible || !isEnrolled) && styles.disabledButton,
        ]}
        onPress={handleAuthenticate}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Confirm Shutdown Command</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    padding: 16,
    width: "100%",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#334155",
  },
  infoText: {
    fontSize: 16,
    color: "#94A3B8",
    marginVertical: 4,
  },
  button: {
    backgroundColor: "#EF4444", // Bright Red for destructive actions like shutdown
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: "#475569",
    shadowColor: "transparent",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
