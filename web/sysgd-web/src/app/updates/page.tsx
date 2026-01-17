import { UpdateCard } from "@/components/update-card";
import { updates } from "@/data/updates";

export default function UpdatesPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Actualizaciones
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Mantente al día con los últimos avances, nuevas funcionalidades y
            mejoras del ecosistema SYSGD.
          </p>
        </div>

        <div className="grid gap-8 max-w-4xl mx-auto">
          {updates.map((update) => (
            <UpdateCard key={update.id} update={update} />
          ))}
        </div>
      </div>
    </div>
  );
}
