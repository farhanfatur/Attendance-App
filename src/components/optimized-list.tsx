// Optimized FlatList Component with Virtualization Tuning

import { UI_CONFIG } from '@/src/config/constants';
import React, { memo, ReactElement, useCallback, useMemo, useRef } from 'react';
import {
    ActivityIndicator,
    FlatList,
    FlatListProps,
    NativeScrollEvent,
    NativeSyntheticEvent,
    RefreshControl,
    StyleSheet,
    Text,
    View,
    ViewToken,
} from 'react-native';

interface OptimizedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: (item: T, index: number) => ReactElement;
  keyExtractor: (item: T, index: number) => string;
  
  // Performance options
  estimatedItemSize?: number;
  overscanCount?: number;
  
  // Loading states
  isLoading?: boolean;
  isRefreshing?: boolean;
  isLoadingMore?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  
  // Empty state
  emptyTitle?: string;
  emptyMessage?: string;
  emptyComponent?: ReactElement;
  
  // Error state
  error?: string | null;
  onRetry?: () => void;
  
  // Header/Footer
  headerComponent?: ReactElement;
  footerComponent?: ReactElement;
  
  // Callbacks
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

function OptimizedListComponent<T>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize = 80,
  overscanCount = 5,
  isLoading = false,
  isRefreshing = false,
  isLoadingMore = false,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.5,
  emptyTitle = 'No items',
  emptyMessage = 'There are no items to display',
  emptyComponent,
  error,
  onRetry,
  headerComponent,
  footerComponent,
  onViewableItemsChanged,
  onScroll,
  ...props
}: OptimizedListProps<T>): ReactElement {
  const flatListRef = useRef<FlatList<T>>(null);
  const isEndReachedCalledRef = useRef(false);

  // Memoized render item wrapper
  const renderItemWrapper = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      return renderItem(item, index);
    },
    [renderItem]
  );

  // Handle end reached with debounce
  const handleEndReached = useCallback(() => {
    if (isEndReachedCalledRef.current || isLoadingMore || !onEndReached) {
      return;
    }
    
    isEndReachedCalledRef.current = true;
    onEndReached();
    
    // Reset flag after delay
    setTimeout(() => {
      isEndReachedCalledRef.current = false;
    }, 1000);
  }, [isLoadingMore, onEndReached]);

  // Refresh control
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    
    return (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        tintColor={UI_CONFIG.refreshControlTintColor}
        colors={[UI_CONFIG.refreshControlTintColor]}
      />
    );
  }, [isRefreshing, onRefresh]);

  // Loading component
  const LoadingComponent = useMemo(() => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }, [isLoading]);

  // Empty component
  const EmptyComponent = useMemo(() => {
    if (isLoading) return null;
    
    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          {onRetry && (
            <Text style={styles.retryText} onPress={onRetry}>
              Tap to retry
            </Text>
          )}
        </View>
      );
    }

    if (emptyComponent) {
      return emptyComponent;
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }, [isLoading, error, emptyTitle, emptyMessage, emptyComponent, onRetry]);

  // Footer component with loading indicator
  const ListFooterComponent = useMemo(() => {
    return (
      <>
        {footerComponent}
        {isLoadingMore && (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.footerLoaderText}>Loading more...</Text>
          </View>
        )}
      </>
    );
  }, [footerComponent, isLoadingMore]);

  // Viewability config
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 250,
  }), []);

  // Item layout for better performance with fixed-size items
  const getItemLayout = useCallback(
    (_data: ArrayLike<T> | null | undefined, index: number) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    }),
    [estimatedItemSize]
  );

  if (isLoading && data.length === 0) {
    return LoadingComponent as ReactElement;
  }

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={renderItemWrapper}
      keyExtractor={keyExtractor}
      
      // Performance optimizations
      initialNumToRender={UI_CONFIG.initialNumToRender}
      maxToRenderPerBatch={UI_CONFIG.maxToRenderPerBatch}
      windowSize={UI_CONFIG.windowSize}
      removeClippedSubviews={UI_CONFIG.removeClippedSubviews}
      updateCellsBatchingPeriod={50}
      
      // Layout
      getItemLayout={estimatedItemSize ? getItemLayout : undefined}
      
      // Scrolling
      scrollEventThrottle={16}
      onScroll={onScroll}
      showsVerticalScrollIndicator={false}
      
      // Pull to refresh
      refreshControl={refreshControl}
      
      // Infinite scroll
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      
      // Empty/Loading states
      ListEmptyComponent={EmptyComponent}
      ListHeaderComponent={headerComponent}
      ListFooterComponent={ListFooterComponent}
      
      // Viewability
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      
      // Extra props
      contentContainerStyle={[
        styles.contentContainer,
        data.length === 0 && styles.emptyContentContainer,
      ]}
      
      {...props}
    />
  );
}

// Memoize the entire component
export const OptimizedList = memo(OptimizedListComponent) as typeof OptimizedListComponent;

// Higher-order component for creating typed optimized lists
export function createOptimizedList<T>() {
  return memo(OptimizedListComponent) as React.MemoExoticComponent<
    (props: OptimizedListProps<T>) => ReactElement
  >;
}

// Hook for list scroll management
export function useListScroll(flatListRef: React.RefObject<FlatList>) {
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [flatListRef]);

  const scrollToIndex = useCallback((index: number, animated = true) => {
    flatListRef.current?.scrollToIndex({ index, animated });
  }, [flatListRef]);

  const scrollToEnd = useCallback((animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, [flatListRef]);

  return { scrollToTop, scrollToIndex, scrollToEnd };
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 14,
    color: '#666666',
  },
});

export default OptimizedList;
