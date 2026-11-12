import { PageLoader } from "@/components/spinner";

// Shown while a page of the app streams in (the detail pages, mostly: the list
// pages render their header right away and show their own loaders).
export default function Loading() {
  return <PageLoader />;
}
