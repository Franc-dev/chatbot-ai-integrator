import { Shell } from "./shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`html,body{height:100%;overflow:hidden;overscroll-behavior:none}`}</style>
      <Shell>{children}</Shell>
    </>
  );
}
