// Report Store - State Management for Reports

import { STORAGE_KEYS } from '@/src/config/constants';
import { apiClient } from '@/src/services/api/client';
import { locationService } from '@/src/services/location/location-service';
import { offlineQueue } from '@/src/services/offline/queue-manager';
import { encryptedStorage } from '@/src/services/storage/encrypted-storage';
import { Report, ReportPhoto, ReportStatus, ReportType } from '@/src/types';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

interface ReportState {
  reports: Report[];
  currentReport: Report | null;
  draftReports: Report[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

interface ReportActions {
  // Fetching
  fetchReports: (status?: ReportStatus) => Promise<void>;
  fetchReportById: (reportId: string) => Promise<Report | null>;
  fetchDraftReports: () => Promise<void>;
  
  // Report operations
  createReport: (type: ReportType, title: string) => Promise<Report>;
  updateReport: (reportId: string, data: Partial<Report>) => Promise<void>;
  submitReport: (reportId: string) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  
  // Photos
  addPhoto: (reportId: string, photo: ReportPhoto) => Promise<void>;
  removePhoto: (reportId: string, photoId: string) => Promise<void>;
  
  // State
  setCurrentReport: (report: Report | null) => void;
  setError: (error: string | null) => void;
}

type ReportStore = ReportState & ReportActions;

export const useReportStore = create<ReportStore>((set, get) => ({
  // Initial state
  reports: [],
  currentReport: null,
  draftReports: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Fetch reports
  fetchReports: async (status?: ReportStatus) => {
    set({ isLoading: true, error: null });
    
    try {
      const params: Record<string, string> = {};
      if (status) {
        params.status = status;
      }

      const response = await apiClient.get<Report[]>('/reports', params);

      if (response.success && response.data) {
        set({ reports: response.data });
        await encryptedStorage.setObject(STORAGE_KEYS.CACHED_REPORTS, response.data);
      }
    } catch (error) {
      // Load from cache
      const cached = await encryptedStorage.getObject<Report[]>(STORAGE_KEYS.CACHED_REPORTS);
      if (cached) {
        set({ reports: cached });
      }
      console.error('Failed to fetch reports:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch single report
  fetchReportById: async (reportId: string) => {
    set({ isLoading: true });
    
    try {
      const response = await apiClient.get<Report>(`/reports/${reportId}`);

      if (response.success && response.data) {
        set({ currentReport: response.data });
        return response.data;
      }
      return null;
    } catch (error) {
      const reports = get().reports;
      const report = reports.find(r => r.id === reportId);
      if (report) {
        set({ currentReport: report });
        return report;
      }
      console.error('Failed to fetch report:', error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch draft reports
  fetchDraftReports: async () => {
    try {
      const response = await apiClient.get<Report[]>('/reports', { status: 'draft' });

      if (response.success && response.data) {
        set({ draftReports: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch draft reports:', error);
    }
  },

  // Create new report
  createReport: async (type: ReportType, title: string) => {
    try {
      const location = await locationService.getCurrentLocation();
      const now = new Date().toISOString();
      const odId = uuidv4();

      const report: Report = {
        id: '',
        odId,
        odSynced: false,
        userId: '',
        type,
        title,
        description: '',
        status: 'draft',
        photos: [],
        location: location || undefined,
        createdAt: now,
        updatedAt: now,
      };

      // Try to create on server
      try {
        const response = await apiClient.post<Report>('/reports', {
          type,
          title,
          location,
          odId,
        });

        if (response.success && response.data) {
          const serverReport = { ...response.data, odSynced: true };
          set(state => ({
            draftReports: [...state.draftReports, serverReport],
            currentReport: serverReport,
          }));
          return serverReport;
        }
      } catch {
        // Save locally
        set(state => ({
          draftReports: [...state.draftReports, report],
          currentReport: report,
        }));
      }

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create report';
      set({ error: message });
      throw error;
    }
  },

  // Update report
  updateReport: async (reportId: string, data: Partial<Report>) => {
    try {
      const now = new Date().toISOString();
      
      // Optimistic update
      set(state => ({
        currentReport: state.currentReport?.odId === reportId || state.currentReport?.id === reportId
          ? { ...state.currentReport, ...data, updatedAt: now }
          : state.currentReport,
        draftReports: state.draftReports.map(r =>
          r.odId === reportId || r.id === reportId
            ? { ...r, ...data, updatedAt: now }
            : r
        ),
      }));

      try {
        await apiClient.patch(`/reports/${reportId}`, data);
      } catch {
        // Will sync later
      }
    } catch (error) {
      console.error('Failed to update report:', error);
    }
  },

  // Submit report
  submitReport: async (reportId: string) => {
    set({ isSubmitting: true, error: null });
    
    try {
      const report = get().draftReports.find(r => r.id === reportId || r.odId === reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      const now = new Date().toISOString();
      const updatedReport: Report = {
        ...report,
        status: 'submitted',
        submittedAt: now,
        updatedAt: now,
        odSynced: false,
      };

      // Optimistic update
      set(state => ({
        draftReports: state.draftReports.filter(r => r.id !== reportId && r.odId !== reportId),
        reports: [...state.reports, updatedReport],
      }));

      // Try to submit to server
      try {
        await apiClient.post(`/reports/${reportId}/submit`, {});
        
        set(state => ({
          reports: state.reports.map(r =>
            r.odId === reportId || r.id === reportId
              ? { ...r, odSynced: true }
              : r
          ),
        }));
      } catch {
        // Queue for offline sync
        await offlineQueue.enqueue('report_submit', {
          reportId: report.odId,
          report: updatedReport,
        }, {
          priority: 60,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit report';
      set({ error: message });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Delete report
  deleteReport: async (reportId: string) => {
    try {
      set(state => ({
        draftReports: state.draftReports.filter(r => r.id !== reportId && r.odId !== reportId),
        reports: state.reports.filter(r => r.id !== reportId && r.odId !== reportId),
        currentReport: state.currentReport?.id === reportId || state.currentReport?.odId === reportId
          ? null
          : state.currentReport,
      }));

      try {
        await apiClient.delete(`/reports/${reportId}`);
      } catch {
        // Already removed locally
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  },

  // Add photo to report
  addPhoto: async (reportId: string, photo: ReportPhoto) => {
    try {
      set(state => {
        const updatePhotos = (report: Report | null) => {
          if (!report || (report.id !== reportId && report.odId !== reportId)) {
            return report;
          }
          return {
            ...report,
            photos: [...report.photos, photo],
            updatedAt: new Date().toISOString(),
          };
        };

        return {
          currentReport: updatePhotos(state.currentReport),
          draftReports: state.draftReports.map(r => updatePhotos(r) || r),
        };
      });

      // Upload photo
      if (photo.localUri) {
        try {
          await apiClient.uploadFile(`/reports/${reportId}/photos`, {
            uri: photo.localUri,
            name: `photo_${photo.id}.jpg`,
            type: 'image/jpeg',
          }, {
            caption: photo.caption || '',
          });
        } catch {
          // Queue for later
          await offlineQueue.enqueue('photo_upload', {
            reportId,
            photo,
          }, {
            priority: 20,
          });
        }
      }
    } catch (error) {
      console.error('Failed to add photo:', error);
    }
  },

  // Remove photo from report
  removePhoto: async (reportId: string, photoId: string) => {
    try {
      set(state => {
        const removePhoto = (report: Report | null) => {
          if (!report || (report.id !== reportId && report.odId !== reportId)) {
            return report;
          }
          return {
            ...report,
            photos: report.photos.filter(p => p.id !== photoId),
            updatedAt: new Date().toISOString(),
          };
        };

        return {
          currentReport: removePhoto(state.currentReport),
          draftReports: state.draftReports.map(r => removePhoto(r) || r),
        };
      });

      try {
        await apiClient.delete(`/reports/${reportId}/photos/${photoId}`);
      } catch {
        // Already removed locally
      }
    } catch (error) {
      console.error('Failed to remove photo:', error);
    }
  },

  // Set current report
  setCurrentReport: (report: Report | null) => {
    set({ currentReport: report });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));

export default useReportStore;
