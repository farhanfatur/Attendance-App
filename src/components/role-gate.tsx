// Role-Based UI Components

import { ROLE_PERMISSIONS } from '@/src/config/constants';
import { useAuthStore } from '@/src/store/auth-store';
import { UserRole } from '@/src/types';
import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Permission = keyof typeof ROLE_PERMISSIONS.admin;

interface RoleGateProps {
  children: ReactNode;
  roles?: UserRole[];
  permissions?: Permission[];
  fallback?: ReactNode;
  requireAll?: boolean; // If true, requires all permissions. If false, requires any.
}

/**
 * Component that renders children only if user has required role/permission
 */
export function RoleGate({
  children,
  roles,
  permissions,
  fallback = null,
  requireAll = false,
}: RoleGateProps): ReactNode {
  const { user, hasPermission } = useAuthStore();

  const hasAccess = useMemo(() => {
    if (!user) return false;

    // Check roles
    if (roles && roles.length > 0) {
      if (!roles.includes(user.role)) {
        return false;
      }
    }

    // Check permissions
    if (permissions && permissions.length > 0) {
      if (requireAll) {
        return permissions.every(p => hasPermission(p));
      } else {
        return permissions.some(p => hasPermission(p));
      }
    }

    return true;
  }, [user, roles, permissions, requireAll, hasPermission]);

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
}

interface RoleBasedContentProps {
  admin?: ReactNode;
  supervisor?: ReactNode;
  fieldOfficer?: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders different content based on user role
 */
export function RoleBasedContent({
  admin,
  supervisor,
  fieldOfficer,
  fallback = null,
}: RoleBasedContentProps): ReactNode {
  const { user } = useAuthStore();

  if (!user) return fallback;

  switch (user.role) {
    case 'admin':
      return admin ?? fallback;
    case 'supervisor':
      return supervisor ?? fallback;
    case 'field_officer':
      return fieldOfficer ?? fallback;
    default:
      return fallback;
  }
}

interface PermissionGateProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
}

/**
 * Component that renders children only if user has specific permission
 */
export function PermissionGate({
  children,
  permission,
  fallback = null,
}: PermissionGateProps): ReactNode {
  const { hasPermission } = useAuthStore();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return <>{children}</>;
}

interface AccessDeniedProps {
  message?: string;
}

/**
 * Access denied placeholder component
 */
export function AccessDenied({
  message = "You don't have permission to view this content",
}: AccessDeniedProps): ReactNode {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Access Denied</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

/**
 * Hook to check if user has specific role
 */
export function useRole() {
  const { user, hasPermission, isRole } = useAuthStore();

  const isAdmin = isRole('admin');
  const isSupervisor = isRole('supervisor');
  const isFieldOfficer = isRole('field_officer');
  const isManager = isAdmin || isSupervisor;

  return {
    role: user?.role,
    isAdmin,
    isSupervisor,
    isFieldOfficer,
    isManager,
    hasPermission,
    isRole,
  };
}

/**
 * Hook for role-based navigation
 */
export function useRoleNavigation() {
  const { role } = useRole();

  const getHomeRoute = () => {
    switch (role) {
      case 'admin':
        return '/(tabs)/admin';
      case 'supervisor':
        return '/(tabs)/supervisor';
      case 'field_officer':
      default:
        return '/(tabs)';
    }
  };

  const getTabRoutes = () => {
    switch (role) {
      case 'admin':
        return ['dashboard', 'officers', 'tasks', 'reports', 'settings'];
      case 'supervisor':
        return ['dashboard', 'team', 'tasks', 'reports', 'profile'];
      case 'field_officer':
      default:
        return ['home', 'tasks', 'attendance', 'reports', 'profile'];
    }
  };

  return {
    homeRoute: getHomeRoute(),
    tabRoutes: getTabRoutes(),
  };
}

/**
 * Higher-order component for role-based access
 */
export function withRoleAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    roles?: UserRole[];
    permissions?: Permission[];
    fallback?: React.ComponentType;
  }
): React.FC<P> {
  const { roles, permissions, fallback: FallbackComponent } = options;

  return function WithRoleAccess(props: P) {
    return (
      <RoleGate
        roles={roles}
        permissions={permissions}
        fallback={FallbackComponent ? <FallbackComponent /> : <AccessDenied />}
      >
        <WrappedComponent {...props} />
      </RoleGate>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default RoleGate;
