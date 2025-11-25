-- Supprimer les catégories existantes car elles sont partagées et doivent être privées
DELETE FROM "Category";

-- Ajouter la colonne userId
ALTER TABLE "Category" ADD COLUMN "userId" TEXT NOT NULL;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supprimer l'ancienne contrainte unique sur name
DROP INDEX IF EXISTS "Category_name_key";

-- Ajouter la nouvelle contrainte unique sur userId et name
CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");


