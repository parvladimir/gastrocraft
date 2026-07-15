import { Container } from "@/components/layout/container";

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <Container className="flex flex-col gap-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} GastroCraft</p>
        <p>Restaurant Digital Solutions</p>
      </Container>
    </footer>
  );
}
