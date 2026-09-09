import { StyleSheet, Text, View } from "react-native";
import NavBar from "./components/NavBar";

export default function HomeScreen() {
  return (
    <>
      <View style={styles.container}>
        <Text style={styles.text}>Nexus Dashboard!</Text>
        <Text style={styles.subtext}>The Dashboard will be placed here</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: "#666",
  },
});
