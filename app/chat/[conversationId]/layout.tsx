import Sidebar from "./Sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}