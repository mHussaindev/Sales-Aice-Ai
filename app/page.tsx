// import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import CallToAction from '../components/CTA';
import DemoSection from '../components/landingPage/DemoSection';
import FeatureSection from '../components/landingPage/FeatureSection';
import HeroSection from '../components/landingPage/HeroSection';
import Chart from "@/components/landingPage/ChartSection";
import LogoCarousel from '../components/LogoCarousel';


// const Chat = dynamic(() => import("@/components/Chat"), {
//   ssr: false,
// });

export default function Page() {
  // const accessToken = await getHumeAccessToken();
  // console.log("Access Token:", accessToken);

  // if (!accessToken) {
  //   throw new Error('Unable to get access token');
  // }

  return (
    <>
        <HeroSection />
        <Chart/>
        <FeatureSection />
        {/* <DemoSection /> */}

        <section className="demo bg-gray-100 dark:bg-[#131B25]" id="demo">
          <div className="container1">
            {/* <h2 className="text-gray-900 dark:text-white">See Sales AICE In Action</h2>
            <div className="sandbox_header">
              Watch how AICE handles a complete sales conversation from objection to close
            </div>
            <div>
              <Chat accessToken={accessToken} />
            </div> */}
            <div className="sandbox_header container1 text-gray-900 dark:text-white">
              AICE handles a complete sales conversation from objection to close
            </div>

            <div className="demo-stats mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="stat-card text-center p-8 bg-white bg-opacity-80 dark:bg-[#1A2D45] dark:bg-opacity-10 rounded-lg">
                <h2 className="text-yellow-600 dark:text-[#FFD700] text-4xl mb-2">95%</h2>
                <p className="text-gray-800 dark:text-white">Conversation Completion Rate</p>
              </div>
              <div className="stat-card text-center p-8 bg-white bg-opacity-80 dark:bg-[#1A2D45] dark:bg-opacity-10 rounded-lg">
                <h2 className="text-yellow-600 dark:text-[#FFD700] text-4xl mb-2">&lt;1s</h2>
                <p className="text-gray-800 dark:text-white">Average Response Time</p>
              </div>
              <div className="stat-card text-center p-8 bg-white bg-opacity-80 dark:bg-[#1A2D45] dark:bg-opacity-10 rounded-lg">
                <h2 className="text-yellow-600 dark:text-[#FFD700] text-4xl mb-2">24/7</h2>
                <p className="text-gray-800 dark:text-white">Availability</p>
              </div>
              <div className="stat-card text-center p-8 bg-white bg-opacity-80 dark:bg-[#1A2D45] dark:bg-opacity-10 rounded-lg">
                <h2 className="text-yellow-600 dark:text-[#FFD700] text-4xl mb-2">∞</h2>
                <p className="text-gray-800 dark:text-white">Concurrent Conversations</p>
              </div>
            </div>
          </div>
        </section>
        <CallToAction />
        <LogoCarousel />
        
    </>
  );
}
