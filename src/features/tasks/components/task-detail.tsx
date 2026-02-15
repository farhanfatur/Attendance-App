// Task Detail Screen Component

import { Badge, Button, Card, Divider } from '@/src/components/ui';
import { useTaskStore } from '@/src/store/task-store';
import { TaskChecklistItem, TaskStatus } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface TaskDetailProps {
  taskId: string;
  onBack?: () => void;
}

export function TaskDetail({ taskId, onBack }: TaskDetailProps) {
  const {
    currentTask,
    taskUpdates,
    isUpdating,
    fetchTaskById,
    fetchTaskUpdates,
    startTask,
    completeTask,
    updateTaskStatus,
    updateChecklist,
    addTaskNote,
  } = useTaskStore();

  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  useEffect(() => {
    fetchTaskById(taskId);
    fetchTaskUpdates(taskId);
  }, [taskId]);

  const handleStartTask = async () => {
    try {
      await startTask(taskId);
      Alert.alert('Success', 'Task started!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to start task');
    }
  };

  const handleCompleteTask = async () => {
    Alert.alert(
      'Complete Task',
      'Are you sure you want to mark this task as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeTask(taskId);
              Alert.alert('Success', 'Task completed!');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to complete task');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = (status: TaskStatus) => {
    Alert.alert(
      'Change Status',
      `Change task status to "${status}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateTaskStatus(taskId, status),
        },
      ]
    );
  };

  const handleChecklistToggle = (item: TaskChecklistItem) => {
    updateChecklist(taskId, item.id, !item.isCompleted);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    
    await addTaskNote(taskId, noteText.trim());
    setNoteText('');
    setShowNoteInput(false);
    fetchTaskUpdates(taskId);
  };

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      await addTaskNote(taskId, 'Photo added', [result.assets[0].uri]);
      fetchTaskUpdates(taskId);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: '#8E8E93',
      medium: '#007AFF',
      high: '#FF9500',
      urgent: '#FF3B30',
    };
    return colors[priority] || '#8E8E93';
  };

  const getStatusVariant = (status: TaskStatus) => {
    const variants: Record<TaskStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      pending: 'default',
      assigned: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger',
      on_hold: 'default',
    };
    return variants[status];
  };

  if (!currentTask) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const task = currentTask;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.priorityBadge}>
              <Ionicons
                name="flag"
                size={14}
                color={getPriorityColor(task.priority)}
              />
              <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                {task.priority} priority
              </Text>
            </View>
            <Badge label={task.status.replace('_', ' ')} variant={getStatusVariant(task.status)} />
          </View>
          
          <Text style={styles.title}>{task.title}</Text>
          
          {task.description && (
            <Text style={styles.description}>{task.description}</Text>
          )}
        </View>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          {task.clientName && (
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={20} color="#8E8E93" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Client</Text>
                <Text style={styles.detailValue}>{task.clientName}</Text>
                {task.clientPhone && (
                  <TouchableOpacity>
                    <Text style={styles.detailLink}>{task.clientPhone}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {task.address && (
            <>
              <Divider />
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color="#8E8E93" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{task.address}</Text>
                  <TouchableOpacity>
                    <Text style={styles.detailLink}>Open in Maps</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {task.dueDate && (
            <>
              <Divider />
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>
                    {format(new Date(task.dueDate), 'EEEE, MMMM d, yyyy')}
                  </Text>
                </View>
              </View>
            </>
          )}

          {task.estimatedDuration && (
            <>
              <Divider />
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#8E8E93" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Estimated Duration</Text>
                  <Text style={styles.detailValue}>
                    {Math.floor(task.estimatedDuration / 60)}h {task.estimatedDuration % 60}m
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Checklist */}
        {task.checklistItems && task.checklistItems.length > 0 && (
          <Card style={styles.checklistCard} title="Checklist">
            {task.checklistItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistItem}
                onPress={() => handleChecklistToggle(item)}
              >
                <Ionicons
                  name={item.isCompleted ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={item.isCompleted ? '#34C759' : '#C7C7CC'}
                />
                <Text
                  style={[
                    styles.checklistText,
                    item.isCompleted && styles.checklistTextCompleted,
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Updates/Notes */}
        <Card style={styles.updatesCard} title="Activity">
          <TouchableOpacity
            style={styles.addNoteButton}
            onPress={() => setShowNoteInput(!showNoteInput)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addNoteText}>Add a note</Text>
          </TouchableOpacity>

          {showNoteInput && (
            <View style={styles.noteInputContainer}>
              <TextInput
                style={styles.noteInput}
                placeholder="Write a note..."
                value={noteText}
                onChangeText={setNoteText}
                multiline
              />
              <View style={styles.noteActions}>
                <TouchableOpacity onPress={handleAddPhoto} style={styles.photoButton}>
                  <Ionicons name="camera-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Button
                  title="Add"
                  onPress={handleAddNote}
                  size="small"
                  disabled={!noteText.trim()}
                />
              </View>
            </View>
          )}

          <Divider />

          {taskUpdates.map((update) => (
            <View key={update.id} style={styles.updateItem}>
              <View style={styles.updateDot} />
              <View style={styles.updateContent}>
                <Text style={styles.updateText}>
                  {update.type === 'status_change'
                    ? `Status changed to ${update.newValue}`
                    : update.newValue}
                </Text>
                <Text style={styles.updateTime}>
                  {format(new Date(update.createdAt), 'MMM d, h:mm a')}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Spacer for bottom actions */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {task.status === 'assigned' || task.status === 'pending' ? (
          <Button
            title="Start Task"
            onPress={handleStartTask}
            icon="play"
            loading={isUpdating}
            fullWidth
            size="large"
          />
        ) : task.status === 'in_progress' ? (
          <View style={styles.actionButtons}>
            <Button
              title="On Hold"
              onPress={() => handleStatusChange('on_hold')}
              variant="outline"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Complete"
              onPress={handleCompleteTask}
              icon="checkmark-circle"
              loading={isUpdating}
              style={{ flex: 2 }}
            />
          </View>
        ) : task.status === 'on_hold' ? (
          <Button
            title="Resume Task"
            onPress={() => handleStatusChange('in_progress')}
            icon="play"
            loading={isUpdating}
            fullWidth
            size="large"
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  detailsCard: {
    margin: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  detailLink: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  checklistCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checklistText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  updatesCard: {
    marginHorizontal: 16,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addNoteText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
  },
  noteInputContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  noteInput: {
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  photoButton: {
    padding: 8,
  },
  updateItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginTop: 6,
    marginRight: 12,
  },
  updateContent: {
    flex: 1,
  },
  updateText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  updateTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButtons: {
    flexDirection: 'row',
  },
});

export default TaskDetail;
