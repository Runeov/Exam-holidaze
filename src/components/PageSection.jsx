export default function PageSection({ children }) {
  return (
    <div className="bg-muted w-full min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col justify-between mx-auto w-full max-w-[var(--container-max)] px-[var(--page-gutter-wide)] pb-16 sm:pb-20">
        {children}
      </div>
    </div>
  );
}
