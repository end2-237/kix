import { Photo } from "@/components/ui/Photo";
import { Drawer, Field, SubmitButton } from "@/components/admin/AdminUI";
import { ImageField } from "@/components/admin/ImageField";
import {
  ajouterImageProduit,
  enregistrerVariante,
  retirerImageProduit,
  retirerVariante,
} from "@/lib/actions";
import { f } from "@/lib/format";
import type { Product, ProductImage, ProductVariant } from "@/db";

/**
 * Les photos et les déclinaisons d'un article, côté vendeur.
 *
 * Une puff ne se vend pas sur une photo unique, et un parfum n'est pas un
 * article à part : dix saveurs, c'était dix fiches à créer, avec dix stocks à
 * tenir et un client perdu. Ici, une galerie et une liste de déclinaisons,
 * chacune avec son stock et, si besoin, son prix.
 */
export function GalerieEtVariantes({
  article,
  images,
  variantes,
}: {
  article: Product;
  images: ProductImage[];
  variantes: ProductVariant[];
}) {
  const vivantes = variantes.filter((v) => v.active);

  return (
    <Drawer summary={`Photos (${images.length + 1}) et déclinaisons (${vivantes.length})`}>
      <div className="flex flex-col gap-4 pt-3">
        <section className="flex flex-col gap-2">
          <span className="label-caps text-[10px]">Galerie</span>
          <p className="text-[11.5px] text-muted">
            La vignette de l&apos;article ouvre toujours la fiche ; ces photos viennent après.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="relative h-16 w-16 overflow-hidden rounded-card border border-gold/45">
              <Photo src={article.image} alt="" fill sizes="64px" className="object-cover" />
            </span>
            {images.map((img) => (
              <span key={img.id} className="relative h-16 w-16 overflow-hidden rounded-card border border-line">
                <Photo src={img.url} alt="" fill sizes="64px" className="object-cover" />
                <form action={retirerImageProduit} className="absolute right-0 bottom-0">
                  <input type="hidden" name="id" value={img.id} />
                  <input type="hidden" name="productId" value={article.id} />
                  <button
                    aria-label="Retirer cette photo"
                    className="grid h-6 w-6 place-items-center bg-bg/85 text-[13px] text-muted hover:text-warn"
                  >
                    ×
                  </button>
                </form>
              </span>
            ))}
          </div>

          <form action={ajouterImageProduit} className="grid gap-2.5 sm:grid-cols-[1fr_auto] sm:items-end">
            <input type="hidden" name="productId" value={article.id} />
            <ImageField name="url" dossier="produits" defaultValue="" />
            <SubmitButton>Ajouter la photo</SubmitButton>
          </form>
        </section>

        <section className="flex flex-col gap-2 border-t border-line pt-3.5">
          <span className="label-caps text-[10px]">Déclinaisons</span>
          <p className="text-[11.5px] text-muted">
            Saveur, contenance, couleur. Prix laissé vide : c&apos;est celui de l&apos;article ({f(article.price)}).
          </p>

          {vivantes.length === 0 ? (
            <p className="text-[12px] text-faint">Aucune pour le moment — l&apos;article se vend tel quel.</p>
          ) : null}

          {vivantes.map((v) => (
            <form key={v.id} action={enregistrerVariante} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="productId" value={article.id} />
              <Field label="Nom" name="name" defaultValue={v.name} />
              <Field label="Prix (F)" name="price" type="number" min={0} defaultValue={v.price ?? undefined} />
              <Field label="Stock" name="stock" type="number" min={0} defaultValue={v.stock} />
              <div className="flex items-end gap-2">
                <SubmitButton>Enregistrer</SubmitButton>
              </div>
              <div className="sm:col-span-4">
                <button
                  formAction={retirerVariante}
                  className="h-9 text-[12px] text-muted transition hover:text-warn"
                >
                  Retirer « {v.name} »
                </button>
              </div>
            </form>
          ))}

          <form action={enregistrerVariante} className="grid gap-2 border-t border-dashed border-line pt-3 sm:grid-cols-[1fr_auto_auto_auto]">
            <input type="hidden" name="productId" value={article.id} />
            <Field label="Nouvelle déclinaison" name="name" placeholder="Mangue glacée" />
            <Field label="Prix (F)" name="price" type="number" min={0} />
            <Field label="Stock" name="stock" type="number" min={0} defaultValue={0} />
            <div className="flex items-end">
              <SubmitButton>Ajouter</SubmitButton>
            </div>
          </form>
        </section>
      </div>
    </Drawer>
  );
}
