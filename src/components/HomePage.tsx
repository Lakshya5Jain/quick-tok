
import React from "react";
import { motion } from "framer-motion";
import { SparklesIcon, FilmIcon, FastForwardIcon, MicIcon } from "lucide-react";
import Logo from "./Logo";
import { Feature, HowItWorksStep } from "@/types";

const HomePage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const features: Feature[] = [
    {
      title: "AI-Powered Scripts",
      description: "Generate engaging scripts with just a topic or use your own custom text.",
      icon: SparklesIcon
    },
    {
      title: "Professional Voices",
      description: "Choose from over 50 realistic AI voices to narrate your content.",
      icon: MicIcon
    },
    {
      title: "Quick Generation",
      description: "Create scroll-stopping videos in minutes, not hours.",
      icon: FastForwardIcon
    },
    {
      title: "Customizable Videos",
      description: "Upload your own images or provide URLs for truly unique content.",
      icon: FilmIcon
    }
  ];

  const steps: HowItWorksStep[] = [
    {
      number: 1,
      title: "Provide a Topic or Script",
      description: "Enter a topic for AI to generate a script, or write your own custom script."
    },
    {
      number: 2,
      title: "Choose Voice & Upload Media",
      description: "Select from our library of voices and upload or provide a URL for your visual media."
    },
    {
      number: 3,
      title: "Generate & Download",
      description: "Click generate and download your professional short-form video ready for sharing."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-quicktok-black text-quicktok-white">
      {/* Hero Section */}
      <section className="hero-gradient py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Logo size="xl" className="justify-center" />
          </motion.div>
          
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            AI-Powered <span className="text-quicktok-orange">Short Videos</span> in Minutes
          </motion.h1>
          
          <motion.p
            className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Create engaging TikTok-style videos with AI-generated scripts, realistic voices, and customizable visuals.
          </motion.p>
          
          <motion.button
            onClick={onGetStarted}
            className="bg-quicktok-orange hover:bg-quicktok-orange/90 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -5 }}
          >
            Get Started Now
          </motion.button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Everything You Need to <span className="text-quicktok-orange">Create Viral Videos</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-zinc-900 p-8 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <feature.icon className="h-12 w-12 text-quicktok-orange mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            How <span className="text-quicktok-orange">Quick-Tok</span> Works
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6 justify-between">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="flex-1 text-center p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-16 h-16 bg-quicktok-orange rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <motion.button
              onClick={onGetStarted}
              className="bg-quicktok-orange hover:bg-quicktok-orange/90 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
              whileHover={{ y: -5 }}
            >
              Create Your First Video
            </motion.button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-black border-t border-zinc-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <Logo size="sm" />
          <p className="text-zinc-500 text-sm mt-4 md:mt-0">
            &copy; {new Date().getFullYear()} Quick-Tok. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
