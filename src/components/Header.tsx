import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="px-4 sm:px-6 pt-4 pb-0">
        <div className="glass rounded-2xl px-5 py-3.5 flex items-center justify-between max-w-[1400px] mx-auto">
          {/* Logo + Name */}
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-indigo-100 group-hover:ring-indigo-300 transition-all shadow-sm">
                <Image
                  src="/edutoppers-logo.png"
                  alt="EduToppers"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="flex flex-col leading-none min-w-0">
              <span className="font-extrabold text-[16px] text-slate-900 tracking-tight group-hover:text-indigo-700 transition-colors">
                EduToppers
              </span>
              <span className="text-[10px] text-indigo-500 font-semibold tracking-widest uppercase">
                Study Platform
              </span>
            </div>
          </Link>

          {/* Nav pills */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "Courses", href: "/", icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )},
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {/* Free badge */}
            <span className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Free Access
            </span>
            {/* Icon btn */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
