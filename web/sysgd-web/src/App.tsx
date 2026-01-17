import { Hero } from "@/components/hero";
import { ModulesSection } from "@/components/modules-section";
import { FeaturesSection } from "@/components/features-section";
import { TechStackSection } from "@/components/tech-stack-section";
import CollaborationSection from "@/components/collaboration-section";
import type { FC } from "react";

const App: FC = () => {
  return (
    <>
      <Page />
    </>
  );
};

const Page: FC = () => {
  return (
    <>
      <Hero />
      <ModulesSection />
      <FeaturesSection />
      <TechStackSection />
      <CollaborationSection />
    </>
  );
};

export default App;
