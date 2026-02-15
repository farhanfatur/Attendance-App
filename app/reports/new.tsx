import { ReportForm } from '@/src/features/reports/components/report-form';
import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewReportScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'New Report' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ReportForm />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});
