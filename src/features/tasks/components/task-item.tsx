// Task List Item Component

import { Badge } from '@/src/components/ui';
import { Task, TaskPriority, TaskStatus } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TaskItemProps {
  task: Task;
  onPress: (task: Task) => void;
  showAssignee?: boolean;
}

const priorityConfig: Record<TaskPriority, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  low: { color: '#8E8E93', icon: 'arrow-down' },
  medium: { color: '#007AFF', icon: 'remove' },
  high: { color: '#FF9500', icon: 'arrow-up' },
  urgent: { color: '#FF3B30', icon: 'alert' },
};

const statusConfig: Record<TaskStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  pending: { label: 'Pending', variant: 'default' },
  assigned: { label: 'Assigned', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  on_hold: { label: 'On Hold', variant: 'default' },
};

function TaskItemComponent({ task, onPress, showAssignee = false }: TaskItemProps) {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  
  const getDueDateText = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    
    if (isToday(dueDate)) {
      return { text: 'Due Today', isOverdue: false };
    }
    if (isTomorrow(dueDate)) {
      return { text: 'Due Tomorrow', isOverdue: false };
    }
    if (isPast(dueDate) && task.status !== 'completed') {
      return { text: `Overdue: ${format(dueDate, 'MMM d')}`, isOverdue: true };
    }
    return { text: format(dueDate, 'MMM d, yyyy'), isOverdue: false };
  };

  const dueDate = getDueDateText();
  
  const completedChecklist = task.checklistItems?.filter(item => item.isCompleted).length ?? 0;
  const totalChecklist = task.checklistItems?.length ?? 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(task)}
      activeOpacity={0.7}
    >
      {/* Priority indicator */}
      <View style={[styles.priorityIndicator, { backgroundColor: priority.color }]} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name={priority.icon} size={16} color={priority.color} />
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
          <Badge label={status.label} variant={status.variant} size="small" />
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>

        {/* Description */}
        {task.description && (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        {/* Meta info */}
        <View style={styles.meta}>
          {/* Client */}
          {task.clientName && (
            <View style={styles.metaItem}>
              <Ionicons name="business-outline" size={14} color="#8E8E93" />
              <Text style={styles.metaText}>{task.clientName}</Text>
            </View>
          )}

          {/* Location */}
          {task.address && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#8E8E93" />
              <Text style={styles.metaText} numberOfLines={1}>
                {task.address}
              </Text>
            </View>
          )}

          {/* Due date */}
          {dueDate && (
            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={dueDate.isOverdue ? '#FF3B30' : '#8E8E93'}
              />
              <Text
                style={[styles.metaText, dueDate.isOverdue && styles.overdueText]}
              >
                {dueDate.text}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Checklist progress */}
          {totalChecklist > 0 && (
            <View style={styles.checklistProgress}>
              <Ionicons name="checkbox-outline" size={14} color="#8E8E93" />
              <Text style={styles.checklistText}>
                {completedChecklist}/{totalChecklist}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(completedChecklist / totalChecklist) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <View style={styles.attachmentsIndicator}>
              <Ionicons name="attach" size={14} color="#8E8E93" />
              <Text style={styles.attachmentsText}>{task.attachments.length}</Text>
            </View>
          )}

          {/* Sync status */}
          {!task.odSynced && (
            <View style={styles.syncIndicator}>
              <Ionicons name="cloud-upload-outline" size={14} color="#FF9500" />
            </View>
          )}
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" style={styles.arrow} />
    </TouchableOpacity>
  );
}

export const TaskItem = memo(TaskItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  priorityIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  meta: {
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#8E8E93',
    flex: 1,
  },
  overdueText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  checklistProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checklistText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    maxWidth: 60,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  attachmentsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  attachmentsText: {
    marginLeft: 2,
    fontSize: 12,
    color: '#8E8E93',
  },
  syncIndicator: {
    marginLeft: 8,
  },
  arrow: {
    alignSelf: 'center',
    marginRight: 12,
  },
});

export default TaskItem;
