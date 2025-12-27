export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar - скрывается на мобилке */}
      <aside className="hidden md:block md:w-64 md:fixed md:left-0 md:top-0 md:h-screen border-r border-white/5 pt-24 px-6 bg-black/20 backdrop-blur-md">
        <div className="space-y-4">
          <div className="text-neon-blue border-l-2 border-neon-blue pl-4 bg-neon-blue/5 py-2 text-[11px] font-bold uppercase tracking-widest">Analytics</div>
          <div className="pl-4 text-gray-500 hover:text-white cursor-pointer text-[11px] font-bold uppercase tracking-widest transition">Payouts</div>
          <div className="pl-4 text-gray-500 hover:text-white cursor-pointer text-[11px] font-bold uppercase tracking-widest transition">My Releases</div>
        </div>
      </aside>

      {/* Контент профиля */}
      <main className="w-full md:ml-64 pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6 md:px-12">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 mb-12 sm:mb-16">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-neon-blue p-1 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
            <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-xs text-gray-500">PHOTO</div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase italic">thq artist</h1>
            <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">artist@thqlabel.com</p>
            <button className="px-4 sm:px-6 py-1.5 sm:py-2 border border-neon-blue text-neon-blue rounded-full text-[9px] sm:text-[10px] font-bold uppercase hover:bg-neon-blue hover:text-black transition">Edit Profile</button>
          </div>
        </div>

        {/* Секция статистики */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {['Monthly Listeners', 'Total Streams', 'Revenue'].map((label) => (
            <div key={label} className="glass-card p-4 sm:p-6 rounded-2xl border border-white/5">
              <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest mb-2">{label}</div>
              <div className="text-xl sm:text-2xl font-black text-neon-blue">-- --</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}