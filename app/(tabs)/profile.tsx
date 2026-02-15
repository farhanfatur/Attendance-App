import { Avatar, Badge, Button, Card } from '@/src/components/ui';
import { APP_CONFIG } from '@/src/config/constants';
import { useAppStore } from '@/src/store/app-store';
import { useAuthStore } from '@/src/store/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  showArrow?: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingItem({ 
  icon, 
  iconColor = '#8E8E93', 
  title, 
  subtitle,
  value, 
  showArrow = true, 
  onPress,
  rightElement,
}: SettingItemProps) {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {rightElement}
      {showArrow && !rightElement && (
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      )}
    </Container>
  );
}

export default function ProfileTab() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isOnline, lastSyncTime, pendingSync } = useAppStore();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return <Badge label="Admin" variant="info" />;
      case 'supervisor':
        return <Badge label="Supervisor" variant="warning" />;
      default:
        return <Badge label="Field Officer" variant="success" />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar name={user?.name || 'User'} size={80} />
          <Text style={styles.profileName}>{user?.name || 'User Name'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@company.com'}</Text>
          <View style={styles.roleBadge}>{getRoleBadge()}</View>
          <Text style={styles.employeeId}>{user?.employeeId || 'EMP-000'}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: pendingSync > 0 ? '#FF9500' : '#34C759' }]}>
              {pendingSync}
            </Text>
            <Text style={styles.statLabel}>Pending Sync</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card padding="none">
            <SettingItem
              icon="person-outline"
              iconColor="#007AFF"
              title="Edit Profile"
              onPress={() => {
                // Navigate to edit profile
              }}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="lock-closed-outline"
              iconColor="#FF9500"
              title="Change Password"
              onPress={() => {
                // Navigate to change password
              }}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="shield-checkmark-outline"
              iconColor="#34C759"
              title="Privacy & Security"
              onPress={() => {
                // Navigate to privacy settings
              }}
            />
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Card padding="none">
            <SettingItem
              icon="notifications-outline"
              iconColor="#FF3B30"
              title="Push Notifications"
              showArrow={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                />
              }
            />
            <View style={styles.divider} />
            <SettingItem
              icon="location-outline"
              iconColor="#007AFF"
              title="Location Services"
              subtitle="Required for attendance"
              showArrow={false}
              rightElement={
                <Switch
                  value={locationEnabled}
                  onValueChange={setLocationEnabled}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                />
              }
            />
            <View style={styles.divider} />
            <SettingItem
              icon="moon-outline"
              iconColor="#5856D6"
              title="Dark Mode"
              showArrow={false}
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                />
              }
            />
          </Card>
        </View>

        {/* Data & Sync Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Sync</Text>
          <Card padding="none">
            <SettingItem
              icon="cloud-outline"
              iconColor="#007AFF"
              title="Sync Status"
              value={lastSyncTime ? `Last: ${new Date(lastSyncTime).toLocaleTimeString()}` : 'Never'}
              showArrow={false}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="download-outline"
              iconColor="#34C759"
              title="Offline Data"
              subtitle="Manage cached data"
              onPress={() => {
                Alert.alert(
                  'Clear Offline Data',
                  'This will remove all cached data. You will need to sync again.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: () => {} },
                  ]
                );
              }}
            />
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card padding="none">
            <SettingItem
              icon="help-circle-outline"
              iconColor="#5856D6"
              title="Help Center"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="chatbubble-ellipses-outline"
              iconColor="#007AFF"
              title="Contact Support"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="document-text-outline"
              iconColor="#8E8E93"
              title="Terms & Privacy"
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Sign Out Button */}
        <View style={styles.section}>
          <Button
            title="Sign Out"
            variant="danger"
            icon="log-out-outline"
            fullWidth
            onPress={handleLogout}
          />
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {APP_CONFIG.name}
          </Text>
          <Text style={styles.versionText}>
            Version {APP_CONFIG.version}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 16,
  },
  profileEmail: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 12,
  },
  employeeId: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 15,
    color: '#8E8E93',
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 60,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  versionText: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 4,
  },
});
