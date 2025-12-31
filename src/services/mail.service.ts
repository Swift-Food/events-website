// services/mail.service.ts
/**
 * Mail Service
 * Handles email-related API calls
 */
import apiClient from '@/lib/auth/apiClient';
import type { AxiosResponse } from 'axios';

// API Route constants
const API_ROUTES = {
  MAIL: {
    REPORT: '/mail/report',
  },
} as const;

interface ReportEventRequest {
  description: string;
  eventId: string;
  userId: string;
}

interface ReportEventResponse {
  success: boolean;
  message?: string;
}

class MailService {
  /**
   * Report an event
   * @param description - Reason for reporting the event
   * @param eventId - The ID of the event being reported
   * @param userId - The ID of the user reporting the event
   */
  async reportEvent(description: string, eventId: string, userId: string): Promise<ReportEventResponse> {
    const response: AxiosResponse<ReportEventResponse> = await apiClient.post(
      API_ROUTES.MAIL.REPORT,
      {
        description,
        eventId,
        userId,
      } as ReportEventRequest
    );
    return response.data;
  }
}

// Singleton instance
export const mailService = new MailService();
export default mailService;
