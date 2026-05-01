import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-bg-secondary/80 backdrop-blur-sm rounded-2xl mx-4 mt-4 border border-border-color">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-accent-purple flex items-center justify-center text-white font-bold text-sm">
          PW
        </div>
        <span className="text-white font-bold text-lg">Dashboard</span>
      </Link>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-white font-semibold text-sm">Spark Developer</div>
          <div className="text-text-secondary text-xs">Admin</div>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-accent-purple bg-bg-card flex items-center justify-center">
          <svg className="w-5 h-5 text-accent-purple" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>
    </header>
  );
}
