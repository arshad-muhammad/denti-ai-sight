import { PageHeader } from "./PageHeader";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function PageLayout({ children, title, description }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader 
        title={title}
        description={description}
      />
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 