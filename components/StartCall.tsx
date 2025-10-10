import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { Phone, Loader } from "lucide-react";
import { toast } from "sonner";
import "../app/page.css";
import { useEffect, useState } from "react";
import axios from 'axios';

export default function StartCall() {
  const { status, connect } = useVoice();
  const [accessToken, setAccessToken] = useState<string>("");
  const [configId, setConfigId] = useState<string | undefined>(undefined);
  const [isFetchingToken, setIsFetchingToken] = useState<boolean>(false);

  const handleStartCall = async () => {
    setIsFetchingToken(true);
    const token = accessToken
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/hume-access-token/`);
      const token = response.data.accessToken;  // ✅ fixed key
      const config = response.data.configId;
      // const config=process.env.Config_ID;


      if (token) {
        setAccessToken(token);
        setConfigId(config);

        console.log("token", token, configId)


        await connect({
          auth: { type: "accessToken", value: token },
          configId: config,
        });

        toast.success("Agent is connected", { position: "bottom-right" });
      }
    } catch (error) {
      toast.error("Agent connection failed", { position: "bottom-right" });
      console.error("Token or call error:", error);
    } finally {
      setIsFetchingToken(false);
    }
  };

  return (
    <AnimatePresence>
      {status.value !== "connected" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            {/* Header */}
            <button className="flex flex-col sm:flex-row items-center justify-center w-full max-w-xs sm:max-w-md space-y-2 sm:space-y-0 sm:space-x-4" onClick={handleStartCall}>
              {status.value === "connecting" || isFetchingToken ? (
                <Loader className="animate-spin size-4 opacity-50 text-gray-600 dark:text-gray-400" />
              ) : (
                <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 dark:from-[#1A2639] dark:to-[#00b3ff] ring-2 ring-yellow-500 dark:ring-[#FFD700] shadow-lg cursor-pointer ringing-anim">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 dark:text-[#FFD700]" strokeWidth={2} />
                </span>
              )}
              <div className="text-2xl font-bold text-gray-900 dark:text-white">Sales AICE</div>
            </button>

            {/* Voicebar */}
            <div
              className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-2 sm:px-6 py-4 rounded-2xl
               bg-blue-50/70 dark:bg-[rgba(10,18,36,0.35)]
               shadow-lg dark:shadow-[inset_0_0_20px_rgba(0,179,255,0.08),0_10px_30px_rgba(0,0,0,0.25)]
               backdrop-blur-md w-full max-w-xs sm:max-w-md mx-auto border border-blue-200/30 dark:border-transparent"
              aria-hidden="true"
            >
              {/* Left tail */}
              <div className="w-[90px] h-[2px] relative opacity-90 overflow-hidden">
                <div
                  className="absolute inset-0
                   bg-blue-400 dark:bg-[radial-gradient(circle_at_center,var(--tw-glow-b)_30%,transparent_31%)]
                   dark:bg-[length:14px_2px] dark:bg-repeat-x animate-dash"
                />
              </div>

              {/* Bars */}
              <div
                className="relative grid grid-flow-col auto-cols-[6px] gap-[2px] items-end
                 px-2 py-4 rounded-lg
                 bg-blue-100/60 dark:bg-[radial-gradient(220px_70px_at_50%_50%,rgba(0,179,255,.12),transparent_60%)]
                 shadow-md dark:shadow-[inset_0_0_30px_rgba(103,211,255,.08),inset_0_0_25px_rgba(76,195,255,.08)]
                 border border-blue-200/40 dark:border-transparent"
                role="img"
                aria-label="animated voice waveform"
              >
                {Array.from({ length: 32 }).map((_, i) => (
                  <span
                    key={i}
                    className="block w-[6px] h-[40px] rounded
                     bg-gradient-to-b from-blue-500 to-blue-600 dark:from-[var(--tw-glow-b)] dark:to-[var(--tw-bar)]
                     shadow-md dark:shadow-[0_0_12px_var(--tw-glow-a),0_0_22px_var(--tw-glow-b),0_0_44px_rgba(76,195,255,.35)]
                     origin-bottom animate-equalize"
                    style={{
                      ['--m' as any]: 1 + 0.1 * Math.sin(i), // Wave multiplier
                      animationDelay: `${i * 0.03}s`,        // Stagger effect
                    }}
                  />
                ))}
              </div>

              {/* Right tail */}
              <div className="w-[90px] h-[2px] relative opacity-90 overflow-hidden">
                <div
                  className="absolute inset-0
                   bg-blue-400 dark:bg-[radial-gradient(circle_at_center,var(--tw-glow-b)_30%,transparent_31%)]
                   dark:bg-[length:14px_2px] dark:bg-repeat-x animate-dash [animation-direction:reverse]"
                />
              </div>
            </div>
          </div>



        </motion.div>
      )}
    </AnimatePresence>

  );
}
