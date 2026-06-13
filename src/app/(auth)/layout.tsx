import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white">
      <div className="absolute left-8 top-7">
        <Image src="/logo-mark.png" alt="Washermann" width={44} height={40} priority />
      </div>
      {children}
    </div>
  );
}
