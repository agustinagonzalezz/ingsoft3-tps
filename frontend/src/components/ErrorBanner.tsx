export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  // role="alert": un lector de pantalla lo anuncia apenas aparece, y las e2e lo encuentran
  // como getByRole("alert") sin depender de su clase ni de su color.
  return <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>;
}
