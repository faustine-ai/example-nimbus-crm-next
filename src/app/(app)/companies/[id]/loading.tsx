import { PageLoader } from "@/components/spinner";

// The Suspense fallback of this page: shown right away on navigation while the
// record is read on the server.
export default function Loading() {
  return <PageLoader />;
}
