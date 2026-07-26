import { useEffect, useState, useRef } from 'react';
import { Download, X, Share2, Plus, Check } from 'lucide-react';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'chrome' | 'ios' | 'other' | null>(null);
  const [iosStep, setIosStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    if (sessionStorage.getItem('installPromptDismissed')) return;

    const ua = navigator.userAgent;
    const iOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (iOS) {
      setPlatform('ios');
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('chrome');
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (!iOS) {
      timerRef.current = setTimeout(() => {
        if (!sessionStorage.getItem('installPromptDismissed')) {
          setShow(true);
        }
      }, 5000);
    } else {
      timerRef.current = setTimeout(() => {
        if (!sessionStorage.getItem('installPromptDismissed')) {
          setShow(true);
        }
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timerRef.current);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShow(false);
      }
      setDeferredPrompt(null);
    } else if (platform === 'ios') {
      if (iosStep < 2) {
        setIosStep(s => s + 1);
      } else {
        setShow(false);
      }
    } else {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  if (!show) return null;

  const iosSteps = [
    { icon: Share2, text: 'Tap the Share button at the bottom of Safari' },
    { icon: Plus, text: 'Scroll down and tap "Add to Home Screen"' },
    { icon: Check, text: 'Tap "Add" in the top right corner' },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
          <Download size={20} className="text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          {platform === 'ios' && iosStep > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">Install Infinity App</p>
              <div className="space-y-2">
                {iosSteps.slice(0, iosStep + 1).map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <step.icon size={12} className="text-orange-600" />
                    </div>
                    <span className="text-xs text-gray-700">{step.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 px-3 py-1.5 bg-[#18181b] text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  {iosStep < 2 ? 'Next' : 'Done'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-gray-500 text-xs font-medium rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Skip
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-900">Install Infinity App</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {platform === 'chrome'
                  ? 'Install this app on your device for quick access and offline support.'
                  : platform === 'ios'
                    ? 'Install this app on your home screen for the best experience.'
                    : 'Add this app to your device for a better experience.'}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 px-3 py-1.5 bg-[#18181b] text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  {platform === 'chrome' ? 'Install' : platform === 'ios' ? 'Show Me How' : 'Got it'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-gray-500 text-xs font-medium rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Not now
                </button>
              </div>
            </>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 p-0.5 shrink-0 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
