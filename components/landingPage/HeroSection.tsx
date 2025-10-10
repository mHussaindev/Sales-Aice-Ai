import "../../app/page.css"
import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import dynamic from "next/dynamic";
import Link from 'next/link';

const Chat = dynamic(() => import("@/components/Chat"), {
  ssr: false,
});

const HeroSection = async () => {
  return (
    <section className="hero1 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#1A2639] dark:to-[#0F1419] pt-6 sm:pt-8 md:pt-16 pb-12 md:pb-24 flex items-center justify-center min-h-[70vh]">
      <div className="hero1-content w-full max-w-xl px-4 sm:px-8 mx-auto text-center md:text-left">
        <h1 className="text-[1.125rem] sm:text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight" style={{ background: 'none', WebkitTextFillColor: 'inherit' }}>
          Your AI Closer, No Scripts.<br className="block md:hidden" /> No Hand-Offs. Just Sales.
        </h1>
        <div className="flex flex-col items-center md:items-start w-full mb-4">
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-full overflow-hidden rounded-lg">
            <Chat />
          </div>
        </div>
        <p className="hero1-subtitle mt-6 text-base sm:text-lg md:text-xl font-medium">
          Meet the first fully autonomous AI sales agent that handles complete sales conversations
          from prospecting to closing, with advanced emotional intelligence and objection handling
          that outperforms top human closers.
        </p>
        <div className="hero1-buttons flex flex-col gap-4 mt-8 items-center justify-center">
          <Link href="/login" className="btn1 btn1-primary w-full max-w-xs text-center bg-yellow-400 dark:bg-yellow-400 text-gray-900 dark:text-gray-900 hover:bg-yellow-500 dark:hover:bg-yellow-500">Get Started</Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
