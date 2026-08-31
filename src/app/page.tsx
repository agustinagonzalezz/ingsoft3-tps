import algoQueNoExiste from './no-existe';
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
