import { Stack } from "expo-router";
import NavBar from "./components/NavBar";

export default function RootLayout() {
  return (
    <>
      <NavBar />
      <Stack>
        <Stack.Screen
          name="index"
          options={{ title: "Home", headerShown: false }}
        />
      </Stack>
    </>
  );
}
