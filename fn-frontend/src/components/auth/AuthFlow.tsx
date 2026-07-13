'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { OtpForm } from './OtpForm';

type Props = {
  // Call onDone to slide to the OTP step.
  renderFirst: (onDone: () => void) => ReactNode;
};


export function AuthFlow({ renderFirst }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'first' | 'otp'>('first');
  const showOtp = step === 'otp';

  const firstRef = useRef<HTMLDivElement>(null);
  const otpRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  // Track the active slide's height, it also updates when validation errors grow it
  useEffect(() => {
    const el = showOtp ? otpRef.current : firstRef.current;
    if (!el) return;
    const update = () => setHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showOtp]);

  return (
    <div
      className="overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      style={{ height }}
    >
      <div
        className="flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ transform: showOtp ? 'translateX(0%)' : 'translateX(-50%)' }}
      >
        {/* OTP first in the DOM; sliding the track to 0% reveals it (rightward). */}
        <div
          ref={otpRef}
          className="w-1/2 shrink-0 self-start"
          aria-hidden={!showOtp}
          {...(!showOtp ? { inert: true } : {})}
        >
          <OtpForm
            active={showOtp}
            onBack={() => setStep('first')}
            onVerified={() => router.push('/dashboard')}
          />
        </div>
        <div
          ref={firstRef}
          className="w-1/2 shrink-0 self-start"
          aria-hidden={showOtp}
          {...(showOtp ? { inert: true } : {})}
        >
          {renderFirst(() => setStep('otp'))}
        </div>
      </div>
    </div>
  );
}
