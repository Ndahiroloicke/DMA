import axios from 'axios';

const BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchWord = async (word) => {
  const trimmedWord = word.trim().toLowerCase();
  const response = await apiClient.get(`/${encodeURIComponent(trimmedWord)}`);
  return response.data;
};
