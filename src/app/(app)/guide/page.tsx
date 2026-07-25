import { Card, CardContent } from "@/components/ui/card";

interface GuideSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function GuideSection({ title, defaultOpen, children }: GuideSectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-slate-200 bg-white open:shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-medium text-slate-900 hover:bg-slate-50">
        {title}
        <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="space-y-2 border-t border-slate-100 px-4 py-4 text-sm text-slate-600">
        {children}
      </div>
    </details>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Guide d&apos;utilisation</h1>
        <p className="text-sm text-slate-500">
          Un rappel rapide de ce que fait chaque page de l&apos;application. Clique sur une
          section pour la déplier.
        </p>
      </div>

      <div className="space-y-3">
        <GuideSection title="📇 Contacts — la liste principale" defaultOpen>
          <p>
            C&apos;est la page d&apos;accueil : elle affiche tous les contacts actifs de la
            base.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Rechercher</strong> : la barre de recherche filtre en temps réel sur le
              nom, prénom, société, email et téléphone.
            </li>
            <li>
              <strong>Filtrer par source</strong> : le menu déroulant à côté de la recherche
              limite l&apos;affichage à une seule origine (Wix, Mailchimp, Manuel...).
            </li>
            <li>
              <strong>Trier</strong> : clique sur un titre de colonne (Nom, Prénom, Email,
              Téléphone, Société, Source) pour trier la liste. Reclique sur le même titre pour
              inverser le sens (une flèche ▲ ou ▼ indique le tri actif).
            </li>
            <li>
              <strong>Ajouter un contact</strong> : bouton « + Ajouter un contact » en haut à
              droite. Seul le nom est obligatoire. Sa source est automatiquement enregistrée
              comme « Manuel ».
            </li>
            <li>
              <strong>Modifier / Supprimer</strong> : les icônes crayon et corbeille sur
              chaque ligne (ou en bas de chaque carte sur mobile). La suppression demande une
              confirmation.
            </li>
            <li>
              <strong>Exporter (CSV)</strong> : télécharge l&apos;ensemble des contacts actifs
              dans un fichier CSV, quel que soit le filtre affiché à l&apos;écran.
            </li>
          </ul>
        </GuideSection>

        <GuideSection title="⬆️ Importer — ajouter plusieurs contacts d'un coup">
          <p>
            Permet de charger un fichier CSV (export Wix, Mailchimp, Excel...) sans tout
            ressaisir à la main.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Origine du fichier</strong> : choisis dans la liste déroulante d&apos;où
              vient ce fichier (Wix, Mailchimp, Brevo, Import_Excel, ou « Autre » pour préciser
              toi-même). Ça garde les sources cohérentes dans les filtres par la suite.
            </li>
            <li>
              <strong>Associer les colonnes</strong> : après avoir chargé le fichier, indique
              quelle colonne de ton CSV correspond à quel champ (Nom, Email...). La colonne «
              Nom » doit obligatoirement être associée pour pouvoir lancer l&apos;import.
            </li>
            <li>
              <strong>Résultat de l&apos;import</strong> : à la fin, un résumé indique combien
              de contacts ont été ajoutés normalement, combien ressemblent à des doublons («
              à vérifier »), et combien de lignes ont été ignorées (sans nom).
            </li>
          </ul>
        </GuideSection>

        <GuideSection title="🔍 Doublons — vérifier les fiches en attente">
          <p>
            Lorsqu&apos;un import détecte un contact dont l&apos;email ou le nom+prénom
            ressemble à une fiche déjà présente, il est enregistré avec le statut « à vérifier »
            plutôt que d&apos;écraser automatiquement l&apos;existant. Cette page rassemble ces
            fiches en attente pour que tu puisses décider toi-même : garder les deux, fusionner,
            ou supprimer le doublon.
          </p>
        </GuideSection>

        <GuideSection title="💡 Bonnes pratiques">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Garde toujours les mêmes noms de source d&apos;un import à l&apos;autre (utilise
              la liste déroulante plutôt que de la retaper) — ça évite de retrouver « Wix » et «
              wix » comme deux sources différentes.
            </li>
            <li>
              Après un import, va faire un tour sur la page Doublons si le résumé indique des
              fiches « à vérifier ».
            </li>
            <li>
              Utilise « Exporter (CSV) » avant toute manipulation importante (gros import,
              nettoyage de liste) pour garder une sauvegarde de secours.
            </li>
          </ul>
        </GuideSection>
      </div>

      <Card>
        <CardContent className="text-sm text-slate-500">
          Une question, un bug, ou une idée d&apos;amélioration ? Reviens simplement sur la
          conversation avec Claude dédiée à cette application.
        </CardContent>
      </Card>
    </div>
  );
}
