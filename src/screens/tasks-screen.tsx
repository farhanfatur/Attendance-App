// Tasks List Screen

import { ErrorBoundary } from '@/src/components/error-boundary';
import { OptimizedList } from '@/src/components/optimized-list';
import { TaskItem } from '@/src/features/tasks/components/task-item';
import { useTaskStore } from '@/src/store/task-store';
import { Task, TaskStatus } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const statusFilters: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, isLoading, fetchTasks, setFilters, filters } = useTaskStore();
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [selectedStatus]);

  const loadTasks = async () => {
    const statusFilter = selectedStatus === 'all' ? undefined : [selectedStatus];
    setFilters({ ...filters, status: statusFilter });
    await fetchTasks({ status: statusFilter });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [selectedStatus]);

  const handleTaskPress = (task: Task) => {
    router.push(`/tasks/${task.id || task.odId}`);
  };

  const filteredTasks = tasks.filter((task) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.clientName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const renderTask = (task: Task) => (
    <TaskItem task={task} onPress={handleTaskPress} />
  );

  const keyExtractor = (task: Task) => task.id || task.odId;

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#8E8E93"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status Filters */}
        <View style={styles.filterContainer}>
          {statusFilters.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                selectedStatus === key && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedStatus(key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === key && styles.filterChipTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Task List */}
        <OptimizedList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={keyExtractor}
          isLoading={isLoading}
          isRefreshing={refreshing}
          onRefresh={onRefresh}
          emptyTitle="No tasks found"
          emptyMessage={
            selectedStatus === 'all'
              ? "You don't have any tasks yet"
              : `No ${selectedStatus.replace('_', ' ')} tasks`
          }
          estimatedItemSize={120}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerStats: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  headerStatsText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1A1A1A',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filterChipSelected: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
});
