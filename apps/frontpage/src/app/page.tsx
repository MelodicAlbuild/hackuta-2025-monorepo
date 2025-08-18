"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import Schedule from "@/components/schedule";
import Faq from "@/components/faq";
import InterestForm from "@/components/interest-form";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="scrollbar-hide bg-gradient-to-b from-black via-blue-950 to-blue-900 min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-[100] bg-gradient-to-r from-black via-blue-950 to-black px-[15px] md:px-[5px] text-center fancy-shadow md:h-16">
        <div className="flex items-center justify-between px-20 md:px-5 h-full">
          <div className="flex items-center">
            <Image
              src="/Logo.svg"
              alt="Main Logo"
              width={30}
              height={34}
              priority
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex xl:space-x-24 lg:space-x-10 md:space-x-5 justify-center w-full">
            {[
              { name: "Home", href: "#" },
              { name: "When & Where", href: "#d-time" },
              { name: "Apply", href: "#apply" },
              { name: "Sponsors", href: "#sponsors" },
              { name: "Schedule", href: "#schedule" },
              { name: "FAQ", href: "#faq" },
            ].map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-white font-franklinGothic lg:text-2xl md:text-lg font-normal hover:text-purple-300 transition shrink"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Mobile Navigation */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={32} /> : <Menu size={32} />}
          </button>

          <div
            className={`absolute top-full left-0 w-full bg-purple-950 bg-opacity-80 backdrop-blur-md flex flex-col items-center space-y-4 py-4 transition-all ${
              isOpen
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            {[
              { name: "Home", href: "#" },
              { name: "When & Where", href: "#d-time" },
              { name: "Apply", href: "#apply" },
              { name: "Sponsors", href: "#founders-arena" },
              { name: "Schedule", href: "#schedule" },
              { name: "FAQ", href: "#faq" },
            ].map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="font-franklinGothic text-white text-xl font-normal hover:text-purple-300 transition"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>

        {/* MLH Trust Badge */}
        <a
          id="mlh-trust-badge"
          href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2026-season&utm_content=black"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed z-[10000] right-2 top-[0px] w-[60px] sm:w-[80px] md:w-[90px]"
        >
          <Image
            width={90}
            height={157}
            src="https://s3.amazonaws.com/logged-assets/trust-badge/2026/mlh-trust-badge-2026-black.svg"
            alt="Major League Hacking 2026 Hackathon Season"
            className="w-full h-auto"
          />
        </a>
      </nav>

      {/* Scrollable Content Wrapper */}
      <div className="relative w-full min-h-[130vh] md:min-h-[170vh] flex justify-center items-start" />

      {/* Logo Container with glow */}
      <div className="absolute w-full top-[5%] sm:top-[20%] md:top-[15%] lg:top-[20%] left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
        <Image
          src="/Logo.svg"
          alt="Main Logo"
          className="absolute bottom-[-400px] sm:bottom-[-400px] md:bottom-[-400px] w-[50%] sm:w-[60%] max-w-[250px] sm:max-w-[300px] md:max-w-[400px] h-auto z-50 drop-shadow-[0_0_30px_rgba(61,58,255,0.41)]"
          width={402}
          height={439}
        />
        <Image
          src="/hackutalogo.svg"
          alt="HackUTA Logo"
          className="absolute bottom-[-460px] sm:bottom-[-460px] md:bottom-[-510px] w-[50%] sm:w-[60%] max-w-[250px] sm:max-w-[300px] md:max-w-[400px] h-auto z-50 drop-shadow-[0_0_30px_rgba(61,58,255,0.41)]"
          width={418}
          height={113}
        />
      </div>

      {/* Buildings + Glow */}
      <div className="absolute w-full top-[70%] sm:top-[75%] md:top-[50%] left-0 flex justify-center items-end">
        <div className="relative w-full">
          <Image
            src="/BuildingGlow.svg"
            alt="Building Glow"
            className="absolute top-[40px] sm:top-[60px] md:top-[40px] w-full h-auto z-10 building-glow-mask"
            width={1438}
            height={730}
          />
          <Image
            src="/Buildings.svg"
            alt="Buildings"
            className="absolute top-0 w-full h-auto z-20 building-mask"
            width={1440}
            height={761}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="font-franklinCondensed text-white text-center w-[100vw] mx-auto px-6 sm:px-10 p-[40px] mt-[-150px]">
        <section
          id="d-time"
          className="scroll-mt-16 pt-10 mx-auto p-[40px] sm:p-[50px] flex flex-col items-center"
        >
          <h2 className="text-3xl sm:text-5xl font-bold">WHEN AND WHERE?</h2>
        </section>
        <section id="d-time-content" className="w-full flex justify-center">
          <p className="text-xl sm:text-3xl font-normal text-center max-w-[600px]">
            October 4th - 5th 2025
            <br />
            SWSH/SEIR, UTA Campus
          </p>
        </section>

        <div className="mt-16" />

        <section
          id="apply"
          className="scroll-mt-16 pt-10 mx-auto p-[40px] sm:p-[50px] flex flex-col items-center"
        >
          <h2 className="text-3xl sm:text-5xl font-bold">
            ARE YOU READY TO GO BEYOND?
          </h2>
        </section>
        {/* Interest Form */}
        <section id="interest-form" className="py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-center items-center gap-x-16 gap-y-5 xl:gap-28 lg:flex-row lg:justify-between max-lg:max-w-2xl mx-auto max-w-full w-[70%]">
              <div className="w-full">
                <div className="text-lg sm:text-2xl font-normal mb-4">
                  <InterestForm />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="discord" className="w-full flex justify-center">
          <a
            href="https://discord.gg/2bVsYS3SgS"
            target="_blank"
            rel="noopener noreferrer"
            className="font-franklinGothic relative px-8 py-3 text-lg sm:text-2xl font-semibold text-white rounded-full transition duration-300
              bg-gradient-to-r from-purple-600 to-red-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl w-[90%] max-w-[300px] text-center"
          >
            JOIN OUR DISCORD
          </a>
        </section>

        <section
          id="sponsors"
          className="scroll-mt-16 pt-40 mx-auto p-[40px] flex flex-col items-center"
        >
          <h3 className="text-xl sm:text-3xl font-normal text-center mb-10 max-w-[500px]">
            Brought to you by...
          </h3>
          <Image
            src="/MouserElectronics.svg"
            alt="MouserElectronics"
            className="mb-4"
            width={500}
            height={300}
          />
          <h2 className="text-3xl sm:text-5xl font-bold text-center max-w-[500px]">
            MOUSER ELECTRONICS
          </h2>
          <p className="text-lg sm:text-2xl mt-4 font-normal text-center max-w-[600px]">
            Mouser Electronics is a worldwide leading authorized distributor of
            semiconductors and electronic components for over 700 industry
            leading manufacturers.
          </p>

          <div className="mt-16" />

          <Image
            src="/FoundersArena.svg"
            alt="FoundersArena"
            className="mb-4"
            width={250}
            height={75}
          />
          <h2 className="text-3xl sm:text-5xl font-bold text-center max-w-[500px]">
            THE FOUNDER'S ARENA
          </h2>
          <p className="text-lg sm:text-2xl mt-4 font-normal text-center max-w-[600px]">
            The Founders Arena is a unique and first-of-its-kind "go-to-market"
            Accelerator specifically for WealthTech companies looking to scale
            across the global WealthTech market. With a team of Executive
            Ambassadors, industry experts can guide and drive our start-ups to
            quicker growth...
          </p>

          {/* Spacer between paragraphs */}
          <div className="mt-16" />

          <Image
            src="/mlh-logo-color.png"
            alt="MLH Logo"
            className="mb-4"
            width={300}
            height={100}
          />
          <h2 className="text-3xl sm:text-5xl font-bold text-center max-w-[600px]">
            MAJOR LEAGUE HACKING
          </h2>
          <p className="text-lg sm:text-2xl mt-4 font-normal text-center max-w-[600px]">
            Major League Hacking (MLH) is the official student hackathon league.
            MLH is an engaged and passionate maker community, consisting of the
            next generation of technology leaders and entrepreneurs.
          </p>
        </section>

        <section id="schedule" className="scroll-mt-16 pt-10 mx-auto p-[50px]">
          <h2 className="text-3xl sm:text-5xl font-bold">HackUTA Schedule</h2>
          <div className="flex justify-center mt-4">
            <Schedule />
          </div>
        </section>

        <section id="faq" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-center items-center gap-x-16 gap-y-5 xl:gap-28 lg:flex-row lg:justify-between max-lg:max-w-2xl mx-auto max-w-full w-[70%]">
              <div className="w-full">
                <h2 className="text-3xl sm:text-5xl font-bold mb-2">FAQ</h2>
                <div
                  className="accordion-group"
                  data-accordion="default-accordion"
                >
                  <Faq />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <footer className="w-full text-center py-8">
        <a
          href="http://mlh.io/code-of-conduct"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline text-lg sm:text-base hover:text-purple-300 transition"
        >
          MLH Code of Conduct
        </a>
      </footer>
    </div>
  );
}
