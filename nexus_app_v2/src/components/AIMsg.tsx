import React from "react";
import { Text, View } from "react-native";

const AIMsg = ({ role, message }: { role: string; message: string }) => {
  return (
    <View>
      <Text>{role}</Text>
      <View>
        <Text>{message}</Text>
      </View>
    </View>
  );
};

export default AIMsg;
