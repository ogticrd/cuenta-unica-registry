export const locationApiService = {
  async getCoordinates(ip: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(`/api/location?ip=${encodeURIComponent(ip)}`);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error("[locationApiService.getCoordinates] Failed:", error);
      return null;
    }
  }
};
