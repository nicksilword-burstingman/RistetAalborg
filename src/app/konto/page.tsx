import { AccountView } from "@/components/account-view";
export const metadata = {
  title: "Min konto",
  description:
    "Dit personlige kaffehjørne hos Ristet Aalborg. Gem kaffevalg og leveringsadresse, og se dine bestillinger.",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AccountView />;
}
