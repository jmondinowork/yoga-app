import useSWR, { type SWRConfiguration } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Erreur lors du chargement des données");
    throw error;
  }
  return res.json();
};

/** Typed SWR hook with default fetcher for admin API calls. */
export function useAdminData<T>(
  key: string | null,
  config?: SWRConfiguration
) {
  return useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000, // 30s deduplication window
    ...config,
  });
}
