import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Quote } from 'lucide-react';
import { HandDrawnButton } from '../components/HandDrawnButton';
import { HandDrawnCard } from '../components/HandDrawnCard';
import {
  SquigglyLine,
  SpeechBubble,
  StarDoodle,
  PencilDoodle,
  BookDoodle,
  GlobeDoodle,
  MicrophoneDoodle,
  ChatBubbleDoodle } from
'../components/DoodleDecorations';
const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 40
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const
    }
  }
};
const staggerContainer = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] overflow-hidden font-sans">
      {/* Sticky Top Bar */}
      <nav className="sticky top-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-sm border-b-2 border-[#1A1A1A] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-heading font-bold italic text-2xl group-hover:text-[#DC2626] transition-colors">
              language coach
            </span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/signup"
              className="font-medium hover:text-[#DC2626] transition-colors hidden sm:block">

              Sign Up
            </Link>
            <Link to="/login">
              <HandDrawnButton variant="primary" className="py-2 px-4 text-sm">
                Log In
              </HandDrawnButton>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Decorative Doodles */}
          <GlobeDoodle className="absolute top-10 left-10 w-24 h-24 text-[#F59E0B] opacity-20 -rotate-12 hidden md:block" />
          <SpeechBubble className="absolute top-40 right-20 w-32 h-32 text-[#DC2626] opacity-10 rotate-12 hidden lg:block" />
          <PencilDoodle className="absolute bottom-20 left-1/4 w-20 h-20 text-[#1A1A1A] opacity-10 -rotate-45 hidden md:block" />
          <BookDoodle className="absolute bottom-10 right-1/4 w-28 h-28 text-[#F59E0B] opacity-15 rotate-6 hidden lg:block" />

          {/* Floating Flags */}
          <div className="absolute top-20 right-1/3 text-3xl rotate-12 opacity-80 hidden md:block">
            🇪🇸
          </div>
          <div className="absolute top-1/3 left-20 text-4xl -rotate-12 opacity-80 hidden lg:block">
            🇫🇷
          </div>
          <div className="absolute bottom-1/3 right-10 text-3xl rotate-6 opacity-80 hidden md:block">
            🇯🇵
          </div>
          <div className="absolute bottom-20 left-1/3 text-2xl -rotate-6 opacity-80 hidden sm:block">
            🇩🇪
          </div>

          <motion.div
            className="text-center max-w-4xl mx-auto relative z-10"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}>

            <motion.h1
              variants={fadeInUp}
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">

              Learn any language, one{' '}
              <span className="relative inline-block">
                conversation
                <SquigglyLine className="absolute -bottom-4 left-0 w-full h-4 text-[#DC2626]" />
              </span>{' '}
              at a time
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">

              Your friendly AI coach helps you practice speaking naturally —
              through lessons, topics you love, or just chatting about your day.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center gap-4">

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/login" className="w-full sm:w-auto">
                  <HandDrawnButton
                    variant="primary"
                    className="w-full sm:w-auto text-lg py-4 px-8">

                    Start Learning — It's Free
                  </HandDrawnButton>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <HandDrawnButton
                    variant="outline"
                    className="w-full sm:w-auto text-lg py-4 px-8">

                    See How It Works
                  </HandDrawnButton>
                </a>
              </div>
              <p className="text-sm text-gray-500">
                Not yet a member?{' '}
                <Link
                  to="/signup"
                  className="text-[#DC2626] hover:underline underline-offset-4 decoration-wavy font-bold">
                  Sign up here!
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-24 bg-white border-y-2 border-[#1A1A1A] relative">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16 relative inline-block left-1/2 -translate-x-1/2"
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                margin: '-100px'
              }}
              variants={fadeInUp}>

              <h2 className="font-heading text-4xl md:text-5xl font-bold">
                How it works
              </h2>
              <StarDoodle className="absolute -top-6 -right-10 w-12 h-12 text-[#F59E0B]" />
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                margin: '-100px'
              }}
              variants={staggerContainer}>

              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 border-t-4 border-dashed border-gray-300 -translate-y-1/2 z-0"></div>

              {[
              {
                icon: <GlobeDoodle className="w-12 h-12 text-[#DC2626]" />,
                title: 'Pick a language',
                desc: 'Choose from Spanish, French, Japanese, and more.',
                rotate: 'left' as const,
                num: '1'
              },
              {
                icon: <BookDoodle className="w-12 h-12 text-[#F59E0B]" />,
                title: 'Choose your style',
                desc: 'Structured lessons, topic conversations, or freestyle chat.',
                rotate: 'right' as const,
                num: '2'
              },
              {
                icon:
                <ChatBubbleDoodle className="w-12 h-12 text-[#1A1A1A]" />,

                title: 'Start talking',
                desc: 'Practice real conversations with your AI coach.',
                rotate: 'none' as const,
                num: '3'
              }].
              map((step, idx) =>
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="relative z-10">

                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-white border-2 border-[#1A1A1A] rounded-full flex items-center justify-center font-heading font-bold text-xl z-20 hand-drawn-border">
                    {step.num}
                  </div>
                  <HandDrawnCard
                  rotate={step.rotate}
                  className="h-full flex flex-col items-center text-center p-8 bg-[#FAFAF8]">

                    <div className="mb-6 p-4 bg-white rounded-full border-2 border-[#1A1A1A] hand-drawn-border-alt">
                      {step.icon}
                    </div>
                    <h3 className="font-heading text-2xl font-bold mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-lg">{step.desc}</p>
                  </HandDrawnCard>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              margin: '-100px'
            }}
            variants={staggerContainer}>

            {[
            {
              icon: <BookDoodle className="w-16 h-16 text-[#DC2626]" />,
              title: 'Structured Lessons',
              desc: 'Follow a progressive curriculum. Master the basics like greetings, at the market, or asking for directions before moving on to complex grammar.',
              rotate: 'right' as const
            },
            {
              icon: <SpeechBubble className="w-16 h-16 text-[#F59E0B]" />,
              title: 'Topic Conversations',
              desc: 'Choose topics you actually care about — travel, food, music, or movies. You can even upload your own text to discuss specific subjects.',
              rotate: 'left' as const
            },
            {
              icon: <MicrophoneDoodle className="w-16 h-16 text-[#1A1A1A]" />,
              title: 'Freestyle Chat',
              desc: 'No pressure, just open conversation. Talk about your day, practice your pronunciation, and get gentle corrections from your coach.',
              rotate: 'none' as const
            }].
            map((feature, idx) =>
            <motion.div key={idx} variants={fadeInUp}>
                <HandDrawnCard
                rotate={feature.rotate}
                className="h-full flex flex-col p-8">

                  <div className="mb-6">{feature.icon}</div>
                  <h3 className="font-heading text-2xl font-bold mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-8 flex-1 leading-relaxed">
                    {feature.desc}
                  </p>
                  <Link
                  to="/signup"
                  className="inline-flex items-center font-bold text-[#DC2626] hover:text-[#1A1A1A] transition-colors group">

                    Try it{' '}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </HandDrawnCard>
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* Languages Strip */}
        <section className="py-16 bg-[#F59E0B]/10 border-y-2 border-[#1A1A1A] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl font-bold inline-block relative">
                Languages you can learn
                <SquigglyLine className="absolute -bottom-3 left-0 w-full h-2 text-[#F59E0B]" />
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {[
              { flag: '🇪🇸', name: 'Spanish' },
              { flag: '🇫🇷', name: 'French' },
              { flag: '🇯🇵', name: 'Japanese' },
              { flag: '🇩🇪', name: 'German' },
              { flag: '🇮🇹', name: 'Italian' },
              { flag: '🇧🇷', name: 'Portuguese' },
              { flag: '🇰🇷', name: 'Korean' },
              { flag: '🇨🇳', name: 'Chinese' }].
              map((lang, idx) =>
              <div
                key={idx}
                className={`
                    bg-white border-2 border-[#1A1A1A] px-6 py-3 flex items-center gap-3
                    hand-drawn-border-pill hand-drawn-shadow-sm
                    ${idx % 2 === 0 ? 'rotate-wobble-left' : 'rotate-wobble-right'}
                    hover:-translate-y-1 transition-transform cursor-default
                  `}>

                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-bold text-lg">{lang.name}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              margin: '-100px'
            }}
            variants={fadeInUp}>

            <h2 className="font-heading text-4xl md:text-5xl font-bold flex items-center justify-center gap-4">
              <Sparkles className="text-[#F59E0B] w-8 h-8" />
              What learners say
              <Sparkles className="text-[#F59E0B] w-8 h-8" />
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              margin: '-100px'
            }}
            variants={staggerContainer}>

            {[
            {
              quote:
              "I never thought learning Spanish could feel this natural. It's like chatting with a friend!",
              name: 'Maria',
              age: 28,
              color: 'bg-[#DC2626]',
              rotate: 'left' as const
            },
            {
              quote:
              'The topic conversations are genius. I practiced ordering food in French before my Paris trip!',
              name: 'James',
              age: 34,
              color: 'bg-[#F59E0B]',
              rotate: 'none' as const
            },
            {
              quote:
              'Freestyle mode is my favorite. No pressure, just talking about my day in Japanese.',
              name: 'Yuki',
              age: 22,
              color: 'bg-[#1A1A1A]',
              rotate: 'right' as const
            }].
            map((testimonial, idx) =>
            <motion.div key={idx} variants={fadeInUp}>
                <HandDrawnCard
                rotate={testimonial.rotate}
                className="h-full flex flex-col p-8 relative">

                  <Quote className="absolute top-6 right-6 w-12 h-12 text-gray-200 rotate-12" />
                  <p className="text-lg font-medium italic mb-8 relative z-10 flex-1">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div
                    className={`w-12 h-12 rounded-full border-2 border-[#1A1A1A] ${testimonial.color} text-white flex items-center justify-center font-heading font-bold text-xl hand-drawn-border`}>

                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A1A]">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Age {testimonial.age}
                      </p>
                    </div>
                  </div>
                </HandDrawnCard>
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* Final CTA Section */}
        <section className="py-32 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden bg-white border-t-2 border-[#1A1A1A]">
          <StarDoodle className="absolute top-20 left-1/4 w-16 h-16 text-[#F59E0B] opacity-40 rotate-45 hidden md:block" />
          <SpeechBubble className="absolute bottom-20 right-1/4 w-24 h-24 text-[#DC2626] opacity-20 -rotate-12 hidden md:block" />
          <ChatBubbleDoodle className="absolute top-1/3 right-10 w-20 h-20 text-[#1A1A1A] opacity-10 rotate-12 hidden lg:block" />

          <motion.div
            className="max-w-3xl mx-auto relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              margin: '-100px'
            }}
            variants={staggerContainer}>

            <motion.h2
              variants={fadeInUp}
              className="font-heading text-4xl md:text-6xl font-bold mb-6">

              Ready to start your language journey?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 mb-10">

              Join thousands of learners having real conversations in new
              languages.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center gap-6">

              <Link to="/login">
                <HandDrawnButton
                  variant="primary"
                  className="text-xl py-5 px-10">

                  Log In & Start Learning
                </HandDrawnButton>
              </Link>
              <p className="text-[#1A1A1A] font-medium">
                Not yet a member?{' '}
                <Link
                  to="/signup"
                  className="text-[#DC2626] hover:underline underline-offset-4 decoration-wavy font-bold">

                  Sign up here!
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#FAFAF8] py-12 px-4 sm:px-6 lg:px-8 border-t-2 border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-heading font-bold italic text-2xl text-[#1A1A1A]">
              language coach
            </span>
            <p className="text-gray-500 text-sm">
              © 2026 Language Coach. Made with ♥ and doodles.
            </p>
          </div>
          <div className="flex gap-6 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-[#DC2626] transition-colors">
              About
            </a>
            <a href="#" className="hover:text-[#DC2626] transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-[#DC2626] transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>);

}

export default LandingPage;
