import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';
import {
  CreateHighlightDto,
  UpdateHighlightDto,
  HighlightQueryDto,
  HighlightResponseDto,
  HighlightListResponseDto,
} from '@/types/highlight';

class HighlightService {
  private readonly baseUrl = '/highlights';

  /**
   * Create a new highlight (auth required)
   */
  async createHighlight(data: CreateHighlightDto): Promise<HighlightResponseDto> {
    const response: AxiosResponse<HighlightResponseDto> = await apiClient.post(
      this.baseUrl,
      data
    );
    return response.data;
  }

  /**
   * Get highlights owned by current user
   */
  async getMyHighlights(query?: HighlightQueryDto): Promise<HighlightListResponseDto> {
    const response: AxiosResponse<HighlightListResponseDto> = await apiClient.get(
      `${this.baseUrl}/me`,
      { params: query }
    );
    return response.data;
  }

  /**
   * Get highlights for a specific user (public)
   */
  async getUserHighlights(
    eventUserId: string,
    query?: HighlightQueryDto
  ): Promise<HighlightListResponseDto> {
    const response: AxiosResponse<HighlightListResponseDto> = await apiClient.get(
      `${this.baseUrl}/user/${eventUserId}`,
      { params: query }
    );
    return response.data;
  }

  /**
   * Get a single highlight by ID (public)
   */
  async getHighlightById(id: string): Promise<HighlightResponseDto> {
    const response: AxiosResponse<HighlightResponseDto> = await apiClient.get(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  /**
   * Update a highlight (owner only)
   */
  async updateHighlight(
    id: string,
    data: UpdateHighlightDto
  ): Promise<HighlightResponseDto> {
    const response: AxiosResponse<HighlightResponseDto> = await apiClient.put(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a highlight (owner only)
   */
  async deleteHighlight(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

export const highlightService = new HighlightService();
export default highlightService;
