// La app es privada: no se indexa en buscadores
export const metadata = {
  title: 'NetAI',
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }) {
  return children;
}
