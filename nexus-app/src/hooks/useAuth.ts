import * as LocalAuthentication from "expo-local-authentication";
import { Alert } from "react-native";

export const useAuth = () => {
  const getAuthenticateRequest = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert("Hardware is not present");
      return false;
    }
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      Alert.alert("Authentication error");
      return false;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to proceed",
      });
      return result.success;
    } catch (error) {
      console.log("Authentication error (e.g., limit reached):", error);
      return false;
    }
  };

  return { getAuthenticateRequest };
};
