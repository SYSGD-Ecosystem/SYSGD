import { Hero } from "@/components/hero";
import { FeaturesSection } from "@/components/features-section";
import { TechStackSection } from "@/components/tech-stack-section";
import CollaborationSection from "@/components/collaboration-section";
import SponsorshipSection from "@/components/sponsorship-section";
import type { FC } from "react";
import  Descubre from "./components/descubre";

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
      <Descubre />
      <FeaturesSection />
      <TechStackSection />
      <CollaborationSection />
      <SponsorshipSection />
    </>
  );
};

export default App;
