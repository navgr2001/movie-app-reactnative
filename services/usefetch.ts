import { useEffect, useState } from "react";

const useFetch = <T>(fetchFunction: () => Promise<T>, autoFetch = true) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
      return result; // <-- return the data
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    if (autoFetch) void fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData, reset };
};

export default useFetch;
