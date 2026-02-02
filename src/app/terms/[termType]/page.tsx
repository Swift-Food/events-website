import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import OrganizerTermsContent from "./OrganizerTermsContent";
import TicketTermsContent from "./TicketTermsContent";

type TermType = "organizer" | "ticket";

interface Props {
 params: Promise<{ termType: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const { termType } = await params;

 if (termType === "organizer") {
  return {
   title: "Organiser Terms and Conditions | Prismo",
   description:
    "Terms and conditions for event organisers using the Prismo platform",
  };
 } else if (termType === "ticket") {
  return {
   title: "Ticket Sales Terms and Conditions | Prismo",
   description:
    "Terms and conditions for purchasing event tickets on the Prismo platform",
  };
 }

 return {
  title: "Terms and Conditions | Prismo",
 };
}

export function generateStaticParams() {
 return [{ termType: "organizer" }, { termType: "ticket" }];
}

export default async function TermsPage({ params }: Props) {
 const { termType } = await params;

 if (termType !== "organizer" && termType !== "ticket") {
  notFound();
 }

 const isOrganizer = termType === "organizer";

 return (
  <div className="min-h-screen ">
   <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 lg:py-12">
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
     {/* Side Navigation */}
     <nav className="lg:w-56 shrink-0">
      <div className="flex flex-row lg:flex-col gap-2 lg:sticky lg:top-24">
       {!isOrganizer ? (
        <span className="flex items-center justify-between rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white lg:px-4">
         Ticket Sales Terms
         <ChevronRight className="hidden lg:block h-4 w-4" />
        </span>
       ) : (
        <Link
         href="/terms/ticket"
         className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors lg:px-4"
        >
         Ticket Sales Terms
         <ChevronRight className="hidden lg:block h-4 w-4" />
        </Link>
       )}
       {isOrganizer ? (
        <span className="flex items-center justify-between rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white lg:px-4">
         Organiser Terms
         <ChevronRight className="hidden lg:block h-4 w-4" />
        </span>
       ) : (
        <Link
         href="/terms/organizer"
         className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors lg:px-4"
        >
         Organiser Terms
         <ChevronRight className="hidden lg:block h-4 w-4" />
        </Link>
       )}
      </div>
     </nav>

     {/* Content */}
     <div className="flex-1 max-w-3xl">
      {isOrganizer ? <OrganizerTermsContent /> : <TicketTermsContent />}
     </div>
    </div>
   </div>
  </div>
 );
}
