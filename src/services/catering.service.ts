import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';
import {
  CateringBundle,
  CreateCateringOrderDto,
  CateringOrder,
  UpdatePickupContactDto,
} from '@/types/catering';

class CateringService {
  private readonly bundlesBaseUrl = '/catering-bundles';
  private readonly ordersBaseUrl = '/catering-orders';

  /**
   * Get all active catering bundles
   */
  async getActiveBundles(): Promise<CateringBundle[]> {
    const response: AxiosResponse<CateringBundle[]> = await apiClient.get(
      `${this.bundlesBaseUrl}/active`
    );
    return response.data;
  }

  /**
   * Get all catering bundles (including inactive)
   */
  async getAllBundles(): Promise<CateringBundle[]> {
    const response: AxiosResponse<CateringBundle[]> = await apiClient.get(
      this.bundlesBaseUrl
    );
    return response.data;
  }

  /**
   * Get a specific bundle by ID
   */
  async getBundleById(id: string): Promise<CateringBundle> {
    const response: AxiosResponse<CateringBundle> = await apiClient.get(
      `${this.bundlesBaseUrl}/${id}`
    );
    return response.data;
  }

  /**
   * Create a new catering order
   */
  async createOrder(orderData: CreateCateringOrderDto): Promise<any> {
    console.log("orderData", JSON.stringify(orderData))
    const response: AxiosResponse<any> = await apiClient.post(
      this.ordersBaseUrl,
      orderData
    );
    return response.data;
  }

  /**
   * Get catering order for a specific event
   */
  async getCateringOrderForEvent(eventId: string): Promise<CateringOrder | null> {
    const response: AxiosResponse<CateringOrder | null> = await apiClient.get(
      `/events/${eventId}/catering`
    );
    return response.data;
  }

  /**
   * Update pickup contact information for a catering order
   */
  async updatePickupContact(data: UpdatePickupContactDto): Promise<CateringOrder> {
    const response: AxiosResponse<CateringOrder> = await apiClient.patch(
      `${this.ordersBaseUrl}/pickup-contact`,
      data
    );
    return response.data;
  }
}

export const cateringService = new CateringService();
