import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { ArrowRightIcon, TargetIcon } from "@/components/icons";
import { NIVEAUX, prixParSeance } from "@/lib/courses";
import { f } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Course, Venue } from "@/db";

export type CoursCarte = {
  course: Course;
  venue: Venue | null;
  inscrits: number;
};

/**
 * Les cours mis en avant, en bannière dans la boutique.
 *
 * Un cours ne se vend pas comme une puff : personne ne le cherche dans un
 * rayon. Il se propose — d'où une bannière, large, qui montre le coach, le
 * niveau et ce que coûte une séance, parce que c'est la comparaison que fait
 * l'élève avant de s'engager sur un forfait.
 */
export function CoursBannieres({ cartes }: { cartes: CoursCarte[] }) {
  if (cartes.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold lg:text-[17px]">Apprendre le billard</h2>
        <Link href="/app/cours" className="press text-[12px] text-gold-text">
          Tous les cours
        </Link>
      </div>

      <div className="-mx-5 flex md:-mx-7 snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:px-7 pb-1 lg:mx-0 lg:grid lg:grid-cols-2 lg:px-0">
        {cartes.map((carte) => (
          <Banniere key={carte.course.id} carte={carte} />
        ))}
      </div>
    </section>
  );
}

function Banniere({ carte }: { carte: CoursCarte }) {
  const { course, venue, inscrits } = carte;
  const restantes = Math.max(0, course.capacity - inscrits);
  const complet = restantes === 0;

  return (
    <Link
      href={`/app/cours/${course.slug}`}
      className="press relative block h-44 w-[19rem] shrink-0 snap-start overflow-hidden rounded-panel border border-line lg:h-48 lg:w-auto"
    >
      <Photo src={course.image} alt="" fill sizes="(max-width: 1024px) 304px, 480px" className="object-cover" />
      <span className="absolute inset-0 bg-linear-to-r from-black/92 via-black/65 to-black/25" />

      <span className="absolute inset-y-0 left-0 flex max-w-[78%] flex-col justify-center gap-1.5 p-4">
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-gold/20 px-2.5 py-1 text-[10px] tracking-[0.08em] text-gold-text uppercase backdrop-blur">
          <TargetIcon size={11} /> {NIVEAUX[course.level] ?? course.level}
        </span>

        <span className="text-[17px] leading-tight font-bold text-white lg:text-[19px]">{course.title}</span>
        <span className="truncate text-[12px] text-white/70">
          {course.coachName}
          {venue ? ` · ${venue.name}` : ""}
        </span>
        <span className="truncate text-[12px] text-white/70">{course.schedule}</span>

        <span className="mt-1 flex items-center gap-2">
          <span className="rounded-full bg-gold px-3 py-1.5 text-[12px] font-semibold text-gold-ink">
            {f(course.price)}
          </span>
          {course.sessions > 1 ? (
            <span className="text-[11.5px] text-white/60">
              {course.sessions} séances · {f(prixParSeance(course))} l&apos;une
            </span>
          ) : null}
        </span>
      </span>

      <span
        className={cn(
          "absolute top-3.5 right-3.5 rounded-full px-2.5 py-1 text-[10.5px] backdrop-blur",
          complet ? "bg-black/70 text-white/60" : restantes <= 3 ? "bg-warn/80 text-white" : "bg-black/60 text-white/80",
        )}
      >
        {complet ? "complet" : `${restantes} place${restantes > 1 ? "s" : ""}`}
      </span>

      <ArrowRightIcon size={16} className="absolute right-4 bottom-4 text-white/60" />
    </Link>
  );
}
