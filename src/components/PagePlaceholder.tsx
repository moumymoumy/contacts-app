interface PagePlaceholderProps {
  title: string;
  description: string;
  step: string;
}

export default function PagePlaceholder({ title, description, step }: PagePlaceholderProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark">{title}</h1>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-sm font-medium text-gray-600">🚧 Ce module sera construit à l'{step}</p>
        <p className="mt-1 text-xs text-gray-400">
          La navigation fonctionne déjà — le contenu et les calculs arrivent à l'étape suivante.
        </p>
      </div>
    </div>
  );
}
