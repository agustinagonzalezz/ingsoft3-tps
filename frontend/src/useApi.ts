import { useCallback, useEffect, useState } from "react";
import { mensajeDeError } from "./reglas";

// Hook mínimo para cargar datos de la API: estado de carga, error y una
// función `recargar` para volver a pedir después de una escritura
// (reemplaza al `revalidatePath` que usábamos con los server actions de Next).
export function useApi<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      setData(await fetcher());
      setError(null);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, [fetcher]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { data, error, recargar };
}
