export const tableHeadRowClass = "bg-accent text-left text-sm font-semibold text-white";
export const thClass = "px-4 py-3 whitespace-nowrap";
export const tdClass = "px-4 py-3 align-top";

export default function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
