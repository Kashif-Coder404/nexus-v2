import React from "react";
import { Text, View } from "react-native";

const UserMsg = ({ role, message }: { role: string; message: string }) => {
  return (
    <View>
      <Text>{role}</Text>
      <View className="bg-primary rounded-xl rounded-bl-none px-4 py-3 mt-3 max-w-[80%]">
        <Text className="text-white">{message}</Text>
      </View>
    </View>
  );
};

export default UserMsg;
