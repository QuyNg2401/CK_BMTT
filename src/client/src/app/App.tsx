import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { TwoFactorScreen } from './components/TwoFactorScreen';
import { EnableTwoFactorScreen } from './components/EnableTwoFactorScreen';
import { Dashboard } from './components/Dashboard';

type Screen = 'login' | 'signup' | '2fa' | 'enable' | 'dashboard';

const screenOrder: Screen[] = ['login', 'signup', '2fa', 'enable', 'dashboard'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [prevScreen, setPrevScreen] = useState<Screen>('login');

  const navigate = (next: Screen) => {
    setPrevScreen(screen);
    setScreen(next);
  };

  const direction = screenOrder.indexOf(screen) >= screenOrder.indexOf(prevScreen) ? 1 : -1;

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
  };

  return (
    <div className="size-full">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={screen}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="size-full"
        >
          {screen === 'login' ? (
            <LoginScreen
              onContinue={() => navigate('2fa')}
              onSignUpClick={() => navigate('signup')}
            />
          ) : screen === 'signup' ? (
            <SignUpScreen
              onSignUp={() => navigate('dashboard')}
              onLoginClick={() => navigate('login')}
            />
          ) : screen === '2fa' ? (
            <TwoFactorScreen
              onBack={() => navigate('login')}
              onVerified={() => navigate('dashboard')}
            />
          ) : screen === 'enable' ? (
            <EnableTwoFactorScreen onComplete={() => navigate('dashboard')} />
          ) : (
            <Dashboard onLogout={() => navigate('login')} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}