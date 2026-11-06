import { Component, type ReactNode } from "react";
import katex from "katex";
export function MathText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\$[^$]+\$)/g).map((part, i) =>
        part.startsWith("$") && part.endsWith("$") ? (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part.slice(1, -1), {
                throwOnError: false,
                trust: false,
              }),
            }}
          />
        ) : (
          part
        ),
      )}
    </>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {children}
    </header>
  );
}
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main>
        <h1>Aplikasi tidak dapat ditampilkan</h1>
        <p>Muat ulang halaman. Data lokal tidak dihapus.</p>
        <button onClick={() => location.reload()}>Muat ulang</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
