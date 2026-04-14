import React from 'react';
import { useStore } from '../store/useStore';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

const RootNavigator: React.FC = () => {
  const hasOnboarded = useStore((state) => state.hasOnboarded);

  if (!hasOnboarded) {
    return <OnboardingScreen />;
  }

  return <TabNavigator />;
};

export default RootNavigator;
