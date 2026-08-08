import { View, Text, TextInput, TouchableOpacity } from "react-native";
import React, { useState } from "react";

const InputBox = () => {
  const [msg, setMsg] = useState("");
  return (
    <View className="flex-row items-center gap-3">
      <Text>InputBox</Text>
      <TextInput
        className="flex-1 bg-gray-200 p-2 rounded-full"
        placeholder="Type a message..."
        onChangeText={setMsg}
      />
      <TouchableOpacity
        className="bg-primary p-2 rounded-full"
        onPress={() => alert(`Message: ${msg}`)}
      >
        <Text className="text-white">Send</Text>
      </TouchableOpacity>
    </View>
  );
};

export default InputBox;
