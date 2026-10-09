export default function EmptyState({ title, description }) {
    return (
        <div className="rounded-2xl border border-dashed border-[#ded9e9] bg-white/60 px-6 py-12 text-center">
            <div className="mb-3 text-4xl text-[#a69bd8]">✧</div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9691a0]">
                {description}
            </p>
        </div>
    );
}
