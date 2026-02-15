// Common UI Components

import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

// ============ Button Component ============
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    fullWidth && styles.buttonFullWidth,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[`buttonText_${variant}`],
    styles[`buttonText_${size}`],
  ];

  const iconColor = variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#007AFF';
  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.buttonIconLeft} />
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.buttonIconRight} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

// ============ Card Component ============
interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({
  children,
  title,
  subtitle,
  onPress,
  style,
  padding = 'medium',
}: CardProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.card, styles[`cardPadding_${padding}`], style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {(title || subtitle) && (
        <View style={styles.cardHeader}>
          {title && <Text style={styles.cardTitle}>{title}</Text>}
          {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </Container>
  );
}

// ============ Badge Component ============
interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium';
}

export function Badge({ label, variant = 'default', size = 'medium' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], styles[`badge_${size}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`], styles[`badgeText_${size}`]]}>
        {label}
      </Text>
    </View>
  );
}

// ============ Status Indicator ============
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: number;
  showLabel?: boolean;
}

export function StatusIndicator({ status, size = 12, showLabel = false }: StatusIndicatorProps) {
  const colors = {
    online: '#34C759',
    offline: '#8E8E93',
    busy: '#FF3B30',
    away: '#FFCC00',
  };

  return (
    <View style={styles.statusContainer}>
      <View style={[styles.statusDot, { width: size, height: size, backgroundColor: colors[status] }]} />
      {showLabel && <Text style={styles.statusLabel}>{status}</Text>}
    </View>
  );
}

// ============ Avatar Component ============
interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

export function Avatar({ name, size = 48, showStatus = false, status = 'offline' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
      {showStatus && (
        <View style={styles.avatarStatus}>
          <StatusIndicator status={status} size={size * 0.25} />
        </View>
      )}
    </View>
  );
}

// ============ Divider Component ============
interface DividerProps {
  label?: string;
  style?: ViewStyle;
}

export function Divider({ label, style }: DividerProps) {
  if (label) {
    return (
      <View style={[styles.dividerContainer, style]}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>{label}</Text>
        <View style={styles.dividerLine} />
      </View>
    );
  }

  return <View style={[styles.divider, style]} />;
}

// ============ Empty State ============
interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'cube-outline', title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {message && <Text style={styles.emptyStateMessage}>{message}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" style={{ marginTop: 16 }} />
      )}
    </View>
  );
}

// ============ Loading Overlay ============
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );
}

// ============ Sync Status Banner ============
interface SyncBannerProps {
  pendingCount: number;
  isSyncing: boolean;
  isOnline: boolean;
  onSync?: () => void;
}

export function SyncBanner({ pendingCount, isSyncing, isOnline, onSync }: SyncBannerProps) {
  if (pendingCount === 0 && isOnline) return null;

  return (
    <TouchableOpacity
      style={[styles.syncBanner, !isOnline && styles.syncBannerOffline]}
      onPress={onSync}
      disabled={isSyncing || !isOnline}
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Ionicons
          name={isOnline ? 'cloud-upload-outline' : 'cloud-offline-outline'}
          size={18}
          color="#FFFFFF"
        />
      )}
      <Text style={styles.syncBannerText}>
        {!isOnline
          ? 'Offline Mode'
          : isSyncing
          ? 'Syncing...'
          : `${pendingCount} pending changes`}
      </Text>
      {isOnline && !isSyncing && pendingCount > 0 && (
        <Text style={styles.syncBannerAction}>Tap to sync</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Button styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  button_primary: {
    backgroundColor: '#007AFF',
  },
  button_secondary: {
    backgroundColor: '#E5E5EA',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  button_danger: {
    backgroundColor: '#FF3B30',
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  button_medium: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  button_large: {
    paddingHorizontal: 28,
    paddingVertical: 18,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: '600',
  },
  buttonText_primary: {
    color: '#FFFFFF',
  },
  buttonText_secondary: {
    color: '#1A1A1A',
  },
  buttonText_outline: {
    color: '#007AFF',
  },
  buttonText_danger: {
    color: '#FFFFFF',
  },
  buttonText_ghost: {
    color: '#007AFF',
  },
  buttonText_small: {
    fontSize: 14,
  },
  buttonText_medium: {
    fontSize: 16,
  },
  buttonText_large: {
    fontSize: 18,
  },
  buttonIconLeft: {
    marginRight: 8,
  },
  buttonIconRight: {
    marginLeft: 8,
  },

  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPadding_none: {
    padding: 0,
  },
  cardPadding_small: {
    padding: 12,
  },
  cardPadding_medium: {
    padding: 16,
  },
  cardPadding_large: {
    padding: 24,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Badge styles
  badge: {
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  badge_default: {
    backgroundColor: '#E5E5EA',
  },
  badge_success: {
    backgroundColor: '#D4EDDA',
  },
  badge_warning: {
    backgroundColor: '#FFF3CD',
  },
  badge_danger: {
    backgroundColor: '#F8D7DA',
  },
  badge_info: {
    backgroundColor: '#CCE5FF',
  },
  badge_small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badge_medium: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontWeight: '600',
  },
  badgeText_default: {
    color: '#1A1A1A',
  },
  badgeText_success: {
    color: '#155724',
  },
  badgeText_warning: {
    color: '#856404',
  },
  badgeText_danger: {
    color: '#721C24',
  },
  badgeText_info: {
    color: '#004085',
  },
  badgeText_small: {
    fontSize: 10,
  },
  badgeText_medium: {
    fontSize: 12,
  },

  // Status styles
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    borderRadius: 100,
  },
  statusLabel: {
    marginLeft: 6,
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },

  // Avatar styles
  avatar: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  avatarStatus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },

  // Divider styles
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerLabel: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
  },

  // Empty state styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },

  // Loading overlay styles
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },

  // Sync banner styles
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  syncBannerOffline: {
    backgroundColor: '#8E8E93',
  },
  syncBannerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  syncBannerAction: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default { Button, Card, Badge, StatusIndicator, Avatar, Divider, EmptyState, LoadingOverlay, SyncBanner };
