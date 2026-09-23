import { Photo } from "@/components/ui/Photo";
import { Drawer, Field, PageHead, Pill, Select, SubmitButton, Table, Td, TextArea } from "@/components/admin/AdminUI";
import { ImageField } from "@/components/admin/ImageField";
import { deleteProduct, saveProduct } from "@/lib/actions";
import { getAllProducts } from "@/lib/queries";
import { getGalerieEtVariantes } from "@/lib/seller";
import { GalerieEtVariantes } from "@/components/vendeur/GalerieEtVariantes";
import { f } from "@/lib/format";

export const metadata = { title: "Produits" };

const categories = [
  { value: "vapes", label: "Vapes & puffs" },
  { value: "billard", label: "Billard" },
];

const tones = [
  { value: "", label: "Aucun" },
  { value: "gold", label: "Vert" },
  { value: "jade", label: "Violet" },
];

export default async function AdminProducts() {
  const products = await getAllProducts();
  const { images, variantes } = await getGalerieEtVariantes(products.map((p) => p.id));

  return (
    <>
      <PageHead title="Produits" subtitle="Catalogue du Master Shop : prix, stock, mise en avant." />

      <Drawer summary="+ Nouveau produit">
        <form action={saveProduct} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nom" name="name" required className="lg:col-span-2" />
          <Field label="Accroche" name="detail" className="lg:col-span-2" />
          <TextArea label="Description" name="description" className="lg:col-span-4" />
          <Field label="Prix (F)" name="price" type="number" defaultValue={5000} />
          <Field label="Stock" name="stock" type="number" defaultValue={10} />
          <Select label="Rayon" name="category" options={categories} />
          <ImageField name="image" dossier="produits" defaultValue="/img/puffs.jpg" />
          <Field label="Badge" name="badgeLabel" placeholder="Top vente" />
          <Select label="Couleur du badge" name="badgeTone" options={tones} />
          <input type="hidden" name="active" value="on" />
          <div className="flex items-end lg:col-span-2">
            <SubmitButton>Créer le produit</SubmitButton>
          </div>
        </form>
      </Drawer>

      <Table head={["Produit", "Rayon", "Prix", "Stock", "Badge", "État", ""]}>
        {products.map((product) => (
          <tr key={product.id}>
            <Td>
              <span className="flex items-center gap-3">
                <Photo
                  src={product.image}
                  alt={product.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-cover"
                />
                <span className="flex flex-col">
                  <span className="font-semibold">{product.name}</span>
                  <span className="text-[11px] text-muted">{product.detail}</span>
                </span>
              </span>
            </Td>
            <Td className="text-muted">{product.category === "vapes" ? "Vapes" : "Billard"}</Td>
            <Td className="font-semibold">{f(product.price)}</Td>
            <Td>
              <Pill tone={product.stock > 5 ? "gold" : product.stock > 0 ? "warn" : "neutral"}>
                {product.stock}
              </Pill>
            </Td>
            <Td className="text-muted">{product.badgeLabel ?? "—"}</Td>
            <Td>
              <Pill tone={product.active ? "gold" : "neutral"}>{product.active ? "En vente" : "Retiré"}</Pill>
            </Td>
            <Td>
              <div className="flex items-center gap-2">
                <details className="relative">
                  <summary className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[11px] marker:hidden">
                    Éditer
                  </summary>
                  <form
                    action={saveProduct}
                    className="absolute right-0 z-10 mt-2 grid w-80 gap-3 border border-line bg-bg p-4 shadow-[var(--mb-shadow)]"
                  >
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="slug" value={product.slug} />
                    <Field label="Nom" name="name" defaultValue={product.name} />
                    <Field label="Accroche" name="detail" defaultValue={product.detail} />
                    <TextArea label="Description" name="description" defaultValue={product.description} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Prix (F)" name="price" type="number" defaultValue={product.price} />
                      <Field label="Stock" name="stock" type="number" defaultValue={product.stock} />
                    </div>
                    <Select label="Rayon" name="category" defaultValue={product.category} options={categories} />
                    <ImageField name="image" dossier="produits" defaultValue={product.image} />
                    <Field label="Badge" name="badgeLabel" defaultValue={product.badgeLabel} />
                    <Select label="Couleur" name="badgeTone" defaultValue={product.badgeTone} options={tones} />
                    <input type="hidden" name="active" value="on" />
                    <SubmitButton />
                  </form>
                </details>
                <details className="relative">
                  <summary className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[11px] marker:hidden">
                    Photos & déclinaisons
                  </summary>
                  <div className="absolute right-0 z-10 mt-2 w-[26rem] border border-line bg-bg p-3 shadow-[var(--mb-shadow)]">
                    <GalerieEtVariantes
                      article={product}
                      images={images.filter((i) => i.productId === product.id)}
                      variantes={variantes.filter((v) => v.productId === product.id)}
                    />
                  </div>
                </details>
                <form action={deleteProduct}>
                  <input type="hidden" name="id" value={product.id} />
                  <button className="rounded-full border border-line px-3 py-1.5 text-[11px] text-muted hover:text-warn">
                    Retirer
                  </button>
                </form>
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
