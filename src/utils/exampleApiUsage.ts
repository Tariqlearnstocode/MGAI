/**
 * Example of using error handling with API calls
 * This is for demonstration purposes only
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleApiError } from './errorHandling';

/**
 * Example hook for fetching data with built-in error handling
 */
export function useFetchWithErrorHandling<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        // Handle HTTP error responses
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err);
      handleApiError(err, navigate);
    } finally {
      setLoading(false);
    }
  }, [url, navigate]);

  return { data, loading, error, fetchData };
}

/**
 * Example of using try/catch with async function
 */
export async function fetchDataSafely<T>(url: string, navigate?: (path: string) => void): Promise<T | null> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    handleApiError(error, navigate);
    return null;
  }
} 