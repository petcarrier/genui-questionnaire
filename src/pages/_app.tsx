import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/toaster";
import { ExternalWindowProvider } from "@/contexts/ExternalWindowContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ExternalWindowProvider>
      <Component {...pageProps} />
      <Toaster />
    </ExternalWindowProvider>
  );
}
