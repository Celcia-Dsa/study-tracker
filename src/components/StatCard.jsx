export default function StatCard({ icon, label, value, color, note }) {
    return (
        <div className="rounded-2xl border border-[#eeece8] bg-white p-5">
            <div className={`mb-5 flex h-9 w-9 items-center justify-center rounded-xl text-lg ${color}`}>
                {icon}
            </div>
            <p className="text-sm text-[#858191]">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            <p className="mt-2 text-xs text-[#aaa6b1]">{note}</p>
        </div>
    );
}
