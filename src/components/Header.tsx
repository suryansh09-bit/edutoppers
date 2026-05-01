import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-bg-secondary/80 backdrop-blur-sm rounded-2xl mx-4 mt-4 border border-border-color">
      <Link href="/" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src="/edutoppers-logo.png"
            alt="EduToppers Logo"
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">EduToppers</span>
      </Link>
    </header>
  );
}
