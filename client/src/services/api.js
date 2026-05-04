import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const macroApi = {
  // 1. Updated to match the generic Top 10 endpoint
  getTopMetrics: async (year, indicatorCode) => {
    const response = await axios.get(`${API_URL}/top/${year}/${indicatorCode}`);
    return response.data;
  },

  // 2. Updated to handle multi-country trend requests
  getTrend: async (isoCodes, indicatorCode) => {
    const response = await axios.get(
      `${API_URL}/trend/${isoCodes}/${indicatorCode}`,
    );
    return response.data;
  },

  // 3. Updated to retrieve the macroeconomic snapshot
  getSnapshot: async (isoCode, year) => {
    const response = await axios.get(`${API_URL}/snapshot/${isoCode}/${year}`);
    return response.data;
  },

  // 4. Fetches the list of available years from Snowflake
  getAvailableYears: async () => {
    const response = await axios.get(`${API_URL}/years`);
    return response.data;
  },

  // 5. Fetches the list of all countries in the database
  getAvailableCountries: async () => {
    const response = await axios.get(`${API_URL}/countries`);
    return response.data;
  },

  //Obtener Mapa
  getMapData: async (year, indicatorCode) => {
    const response = await axios.get(`${API_URL}/map/${year}/${indicatorCode}`);
    return response.data;
  },
};
