import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/theme';

const BlockedScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Account Blocked - Contact Administrator</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  text: {
    fontSize: 18,
    color: colors.error,
    textAlign: 'center',
  },
});

export default BlockedScreen;