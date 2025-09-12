'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="scrollbar-hide bg-gradient-to-b from-black to-blue-950 max-h-screen overflow-hidden relative">
      {/* HackUTA Logo at Top */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[20]">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image
            src="/Logo.svg"
            alt="HackUTA Logo"
            width={100}
            height={100}
            className="drop-shadow-[0_0_20px_rgba(147,51,234,0.3)]"
          />
        </Link>
      </div>

      {/* Main Content - Centered Form */}
      <div className="font-franklinCondensed text-white text-center w-[100vw] mx-auto px-6 sm:px-10 p-[20px] relative z-[10] pb-[500px]">
        <div className="flex items-center justify-center min-h-[100vh]">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
            <div className="bg-black/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 space-y-6">
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-franklinGothic font-bold tracking-tight text-white">
                  Welcome Back
                </h1>
                <p className="text-lg text-gray-300 font-franklinGothic">
                  Sign in to access HackUTA portals
                </p>
              </div>
              <LoginForm />
            </div>
            <p className="px-8 text-center text-xs text-gray-300 font-franklinGothic">
              By clicking continue, you agree to the{' '}
              <Link
                href="https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-purple-300 transition-colors"
              >
                MLH Code of Conduct
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Buildings + Glow */}
      <div className="absolute w-full bottom-0 sm:bottom-auto sm:top-[75%] left-0 z-0">
        <div className="relative w-full">
          <Image
            src="/BuildingGlow.svg"
            alt="Building Glow"
            className="w-full h-auto opacity-80"
            width={1438}
            height={730}
          />
          <Image
            src="/Buildings.svg"
            alt="Buildings"
            className="absolute top-0 left-0 w-full h-auto"
            width={1440}
            height={761}
          />
        </div>
      </div>
    </div>
  );
}
