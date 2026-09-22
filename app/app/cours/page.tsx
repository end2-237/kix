import { ScreenHeader } from "@/components/mb/AppHeader";
import { CoursBannieres, type CoursCarte } from "@/components/mb/CoursBanniere";
import { Card } from "@/components/ui/Card";
import { TargetIcon } from "@/components/icons";
import { getCourses, getMesCours, NIVEAUX } from "@/lib/courses";
import { requireUser } from "@/lib/session";
import { f } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cours de billard" };

export default async function CoursPage() {
  const user = await requireUser();
  const [cours, miens] = await Promise.all([getCourses(), getMesCours(user.id)]);

  const cartes: CoursCarte[] = cours.map((c) => ({ ...c, inscrits: Number(c.inscrits) }));
  const inscrits = miens.filter((m) => m.enrollment.status === "paid");

  return (
    <>
      <ScreenHeader
        title="Apprendre le billard"
        subtitle="Des coachs des salles partenaires, du premier effet à la casse contrôlée."
      />

      {inscrits.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold">Mes cours</h2>
          {inscrits.map(({ enrollment, course, venue }) => (
            <Link key={enrollment.id} href={`/app/cours/${course.slug}`} className="press block">
              <Card tone="gold" shape="panel" className="flex items-center gap-3 p-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-gold-ink">
                  <TargetIcon size={18} />
                </span>
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="truncate text-[14px] font-semibold">{course.title}</span>
                  <span className="truncate text-[12px] text-muted">
                    {course.schedule}
                    {venue ? ` · ${venue.name}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-gold-text">inscrit</span>
              </Card>
            </Link>
          ))}
        </section>
      ) : null}

      {cartes.length === 0 ? (
        <Card tone="dashed" shape="panel" className="px-5 py-12 text-center text-[13px] text-muted">
          Aucun cours proposé pour l&apos;instant.
        </Card>
      ) : (
        <CoursBannieres cartes={cartes} />
      )}

      {/* La liste détaillée sous les bannières : la bannière donne envie, la
          liste laisse comparer. */}
      {cartes.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold">Tous les cours</h2>
          {cartes.map(({ course, venue, inscrits: pris }) => (
            <Link key={course.id} href={`/app/cours/${course.slug}`} className="press block">
              <Card shape="panel" className="flex items-center gap-3 p-3.5">
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="truncate text-[14px] font-semibold">{course.title}</span>
                  <span className="truncate text-[12px] text-muted">
                    {NIVEAUX[course.level] ?? course.level} · {course.coachName}
                    {venue ? ` · ${venue.name}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-[14px] font-semibold text-gold-text">{f(course.price)}</span>
                  <span className="text-[11px] text-muted">
                    {Math.max(0, course.capacity - pris)} place{course.capacity - pris > 1 ? "s" : ""}
                  </span>
                </span>
              </Card>
            </Link>
          ))}
        </section>
      ) : null}
    </>
  );
}
