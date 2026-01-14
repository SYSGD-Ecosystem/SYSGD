import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { ModulesSection } from "@/components/modules-section"
import { FeaturesSection } from "@/components/features-section"
import { TechStackSection } from "@/components/tech-stack-section"
import { CollaborationSection } from "@/components/collaboration-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <ModulesSection />
        <FeaturesSection />
        <TechStackSection />
        <CollaborationSection />
      </main>
      <Footer />
    </div>
  )
}
