import { Badge, Button, Card } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/auth-store';
import { useTaskStore } from '@/src/store/task-store';
import { Task, TaskChecklistItem, TaskPriority, TaskStatus } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_CONFIG: Record<TaskStatus, { color: string; bg: string }> = {
  pending: { color: '#FF9500', bg: '#FFF3E0' },
  assigned: { color: '#5856D6', bg: '#F3E5F5' },
  in_progress: { color: '#007AFF', bg: '#E3F2FD' },
  completed: { color: '#34C759', bg: '#E8F5E9' },
  cancelled: { color: '#8E8E93', bg: '#F2F2F7' },
  on_hold: { color: '#FF9500', bg: '#FFF8E1' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  low: { color: '#34C759', icon: 'arrow-down' },
  medium: { color: '#FF9500', icon: 'remove' },
  high: { color: '#FF3B30', icon: 'arrow-up' },
  urgent: { color: '#FF2D55', icon: 'warning' },
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { tasks, updateTaskStatus, updateChecklist } = useTaskStore();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Find task from store
    const foundTask = tasks.find(t => t.id === id);
    if (foundTask) {
      setTask(foundTask);
    }
    setLoading(false);
  }, [id, tasks]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    
    setUpdating(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      setTask(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task status');
    } finally {
      setUpdating(false);
    }
  };

  const handleChecklistToggle = async (itemId: string) => {
    if (!task || !task.checklistItems) return;
    
    const item = task.checklistItems.find(i => i.id === itemId);
    if (!item) return;
    
    try {
      await updateChecklist(task.id, itemId, !item.isCompleted);
      // Update local state
      const updatedChecklist = task.checklistItems.map(i =>
        i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i
      );
      setTask(prev => prev ? { ...prev, checklistItems: updatedChecklist } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update checklist');
    }
  };

  const getCompletedCount = () => {
    if (!task?.checklistItems) return { completed: 0, total: 0 };
    const completed = task.checklistItems.filter((item: TaskChecklistItem) => item.isCompleted).length;
    return { completed, total: task.checklistItems.length };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
        <Text style={styles.errorText}>Task not found</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const checklistProgress = getCompletedCount();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Task Details',
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <Card style={styles.headerCard}>
            <View style={styles.statusRow}>
              <Badge 
                label={task.status.replace('_', ' ')} 
                variant={task.status === 'completed' ? 'success' : 
                        task.status === 'in_progress' ? 'info' : 'warning'}
              />
              <View style={styles.priorityBadge}>
                <Ionicons name={priorityConfig.icon} size={14} color={priorityConfig.color} />
                <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                  {task.priority}
                </Text>
              </View>
            </View>
            
            <Text style={styles.taskTitle}>{task.title}</Text>
            
            {task.description && (
              <Text style={styles.taskDescription}>{task.description}</Text>
            )}
          </Card>

          {/* Details Card */}
          <Card style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(task.dueDate), 'EEEE, MMMM d, yyyy')}
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#8E8E93" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}
                </Text>
              </View>
            </View>
            
            {task.location && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color="#8E8E93" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{task.address || 'View on map'}</Text>
                  </View>
                  <TouchableOpacity style={styles.mapButton}>
                    <Ionicons name="map-outline" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Card>

          {/* Checklist Card */}
          {task.checklistItems && task.checklistItems.length > 0 && (
            <Card style={styles.checklistCard}>
              <View style={styles.checklistHeader}>
                <Text style={styles.sectionTitle}>Checklist</Text>
                <Text style={styles.checklistProgress}>
                  {checklistProgress.completed}/{checklistProgress.total}
                </Text>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(checklistProgress.completed / checklistProgress.total) * 100}%`,
                      backgroundColor: checklistProgress.completed === checklistProgress.total 
                        ? '#34C759' 
                        : '#007AFF'
                    }
                  ]} 
                />
              </View>
              
              {task.checklistItems.map((item: TaskChecklistItem) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checklistItem}
                  onPress={() => handleChecklistToggle(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    item.isCompleted && styles.checkboxChecked
                  ]}>
                    {item.isCompleted && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={[
                    styles.checklistText,
                    item.isCompleted && styles.checklistTextCompleted
                  ]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Notes Card */}
          {task.notes && (
            <Card style={styles.notesCard}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{task.notes}</Text>
            </Card>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <Card style={styles.attachmentsCard}>
              <Text style={styles.sectionTitle}>Attachments</Text>
              <View style={styles.attachmentsGrid}>
                {task.attachments.map((attachment, index) => (
                  <TouchableOpacity key={index} style={styles.attachmentItem}>
                    <Ionicons name="document-outline" size={32} color="#8E8E93" />
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      Attachment {index + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.actionBar}>
          {task.status === 'pending' && (
            <Button
              title="Start Task"
              icon="play"
              fullWidth
              loading={updating}
              onPress={() => handleStatusChange('in_progress')}
            />
          )}
          
          {task.status === 'in_progress' && (
            <View style={styles.actionButtons}>
              <Button
                title="Cancel"
                variant="outline"
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert(
                    'Cancel Task',
                    'Are you sure you want to cancel this task?',
                    [
                      { text: 'No', style: 'cancel' },
                      { text: 'Yes', onPress: () => handleStatusChange('cancelled') },
                    ]
                  );
                }}
              />
              <Button
                title="Complete"
                icon="checkmark-circle"
                style={styles.actionButton}
                loading={updating}
                onPress={() => handleStatusChange('completed')}
              />
            </View>
          )}
          
          {task.status === 'completed' && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              <Text style={styles.completedText}>Task Completed</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  taskDescription: {
    fontSize: 15,
    color: '#6E6E73',
    marginTop: 8,
    lineHeight: 22,
  },
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 15,
    color: '#1C1C1E',
    marginTop: 2,
  },
  mapButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 32,
  },
  checklistCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checklistText: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
  },
  checklistTextCompleted: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  notesCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 15,
    color: '#6E6E73',
    lineHeight: 22,
  },
  attachmentsCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attachmentItem: {
    width: 80,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  attachmentName: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  actionBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
});
