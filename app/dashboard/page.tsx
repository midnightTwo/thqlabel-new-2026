export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar - скрывается на мобилке */}
      <aside className="hidden md:block md:w-64 md:fixed md:left-0 md:top-0 md:h-screen border-r border-border-subtle pt-24 px-6 sidebar-glass glass-panel rounded-none">
        <div className="space-y-4">
          <div className="text-accent border-l-2 border-accent pl-4 bg-accent-bg py-2 text-[11px] font-bold uppercase tracking-widest">Analytics</div>
          <div className="pl-4 text-foreground-muted hover:text-foreground cursor-pointer text-[11px] font-bold uppercase tracking-widest transition">Payouts</div>
          <div className="pl-4 text-foreground-muted hover:text-foreground cursor-pointer text-[11px] font-bold uppercase tracking-widest transition">My Releases</div>
        </div>
      </aside>

      {/* Контент профиля */}
      <main className="w-full md:ml-64 pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6 md:px-12">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 mb-12 sm:mb-16">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-accent p-1 shadow-glow glass-panel">
            <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-xs text-foreground-muted">PHOTO</div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase italic text-heading">thq artist</h1>
            <p className="text-foreground-muted text-xs sm:text-sm mb-3 sm:mb-4">artist@thqlabel.com</p>
            <button className="px-4 sm:px-6 py-1.5 sm:py-2 btn-glass border border-accent text-accent rounded-full text-[9px] sm:text-[10px] font-bold uppercase hover:bg-accent hover:text-white transition">Edit Profile</button>
          </div>
        </div>

        {/* Секция статистики */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {['Monthly Listeners', 'Total Streams', 'Revenue'].map((label) => (
            <div key={label} className="glass-panel p-4 sm:p-6 rounded-2xl hover:border-accent/30 transition-all duration-300 hover:shadow-glow">
              <div className="text-[9px] sm:text-[10px] text-foreground-muted uppercase tracking-widest mb-2">{label}</div>
              <div className="text-xl sm:text-2xl font-black text-accent">-- --</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}