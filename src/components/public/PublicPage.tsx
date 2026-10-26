import React from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicHero } from './PublicHero';
import { AboutSection } from './AboutSection';
import { ServicesSection } from './ServicesSection';
import { CentersSection } from './CentersSection';
import { GoalsSection } from './GoalsSection';
import { NewsSection } from './NewsSection';
import { PublicFooter } from './PublicFooter';

export const PublicPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-1">
        <PublicHero />
        <AboutSection />
        <ServicesSection />
        <CentersSection />
        <GoalsSection />
        <NewsSection />
      </main>
      <PublicFooter />
    </div>
  );
};
