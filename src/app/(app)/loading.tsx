export default function AppLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto min-h-screen px-6 py-6 pb-24 space-y-6">
        {/* En-tête skeleton */}
        <div className="h-10 w-32 rounded-full bg-muted animate-pulse" />

        {/* Carte principale / résumé du jour */}
        <div className="rounded-3xl bg-muted animate-pulse h-40" />

        {/* Barre de recherche / filtres */}
        <div className="space-y-3">
          <div className="h-10 rounded-2xl bg-muted animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-20 rounded-xl bg-muted animate-pulse" />
            <div className="h-9 w-20 rounded-xl bg-muted animate-pulse" />
            <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>

        {/* Liste d’éléments */}
        <div className="space-y-3">
          <div className="h-20 rounded-2xl bg-muted animate-pulse" />
          <div className="h-20 rounded-2xl bg-muted animate-pulse" />
          <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}


