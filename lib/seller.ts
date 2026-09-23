import "server-only";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db, orderItems, orders, productImages, products, productVariants, users } from "@/db";

/**
 * La place de marché, vue du vendeur.
 *
 * La boutique était un catalogue tenu par l'administrateur : un article
 * n'appartenait à personne, et `saveProduct` exigeait le rôle admin. Un
 * vendeur a maintenant ses articles, ses ventes, et un solde.
 *
 * Tous les montants se lisent dans `order_items`, où le prix, le vendeur et
 * la commission sont figés à la vente — jamais recalculés depuis la fiche
 * produit, qui a pu changer depuis.
 */

export type SoldeVendeur = {
  /** Ce que les clients ont payé pour ses articles. */
  brut: number;
  /** Ce que la plateforme a prélevé. */
  commission: number;
  /** Ce qui lui revient. */
  net: number;
  articlesVendus: number;
  commandes: number;
};

export async function getSoldeVendeur(sellerId: string): Promise<SoldeVendeur> {
  const ligne = (
    await db
      .select({
        brut: sql<number>`coalesce(sum(${orderItems.unitPrice} * ${orderItems.qty}), 0)`,
        commission: sql<number>`coalesce(sum(${orderItems.commission}), 0)`,
        articles: sql<number>`coalesce(sum(${orderItems.qty}), 0)`,
        commandes: sql<number>`count(distinct ${orderItems.orderId})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(eq(orderItems.sellerId, sellerId), payee(orders.status)))
  )[0];

  const brut = Number(ligne?.brut ?? 0);
  const commission = Number(ligne?.commission ?? 0);
  return {
    brut,
    commission,
    net: brut - commission,
    articlesVendus: Number(ligne?.articles ?? 0),
    commandes: Number(ligne?.commandes ?? 0),
  };
}

/**
 * Une vente ne compte que si elle est payée : une commande en attente est une
 * intention, pas une recette, et un vendeur à qui l'on annoncerait un solde
 * gonflé de paniers abandonnés ne nous ferait pas confiance longtemps.
 */
function payee(colonne: typeof orders.status) {
  return sql`${colonne} in ('paid','ready','delivered')`;
}

export async function getProduitsVendeur(sellerId: string) {
  return db
    .select({
      product: products,
      vendus: sql<number>`(select coalesce(sum(oi.qty), 0)
                             from mb.order_items oi
                             join mb.orders o on o.id = oi.order_id
                            where oi.product_id = mb.products.id
                              and o.status in ('paid','ready','delivered'))`,
    })
    .from(products)
    .where(eq(products.sellerId, sellerId))
    // Le nom départage : deux articles créés dans la même milliseconde — ce
    // qui arrive au semis — changeaient de place d'un chargement à l'autre.
    .orderBy(desc(products.createdAt), products.name);
}

/**
 * Les photos et les déclinaisons d'une poignée d'articles, d'un coup.
 *
 * La liste des articles en affiche une dizaine : aller chercher la galerie
 * article par article ferait vingt requêtes pour une page qu'on ouvre au
 * comptoir, sur un réseau qui n'aime pas ça.
 */
export async function getGalerieEtVariantes(productIds: string[]) {
  if (productIds.length === 0) return { images: [], variantes: [] };
  const [images, variantes] = await Promise.all([
    db.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(productImages.sort),
    db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds))
      .orderBy(productVariants.sort, productVariants.name),
  ]);
  return { images, variantes };
}

export async function getVentesVendeur(sellerId: string, limite = 30) {
  return db
    .select({
      item: orderItems,
      order: orders,
      product: products,
      client: users,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .innerJoin(users, eq(users.id, orders.userId))
    .where(and(eq(orderItems.sellerId, sellerId), payee(orders.status)))
    .orderBy(desc(orders.createdAt))
    .limit(limite);
}

/** Le tableau de la place de marché, côté administration. */
export async function getVendeurs() {
  return db
    .select({
      seller: users,
      articles: count(products.id),
      du: sql<number>`(select coalesce(sum(oi.unit_price * oi.qty - oi.commission), 0)
                         from mb.order_items oi
                         join mb.orders o on o.id = oi.order_id
                        where oi.seller_id = mb.users.id
                          and o.status in ('paid','ready','delivered'))`,
    })
    .from(users)
    .leftJoin(products, eq(products.sellerId, users.id))
    .where(eq(users.role, "seller"))
    .groupBy(users.id)
    .orderBy(users.name);
}
