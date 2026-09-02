/**
 * ============================================================
 * Layout — Subgrupo (auth) de la Cocina Móvil
 * ============================================================
 *
 * Layout para las páginas de autenticación (login, recover-password).
 * Usa la imagen de fondo login-bg.jpg con overlay sutil para
 * mantener la legibilidad del formulario.
 *
 * Centra el contenido vertical y horizontalmente, con un
 * contenedor mobile-first (max-w-sm / max-w-md).
 *
 * Es anidado dentro de `(cocina-movil)/layout.tsx`.
 * ============================================================
 */
export default function CmAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main
      className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(135deg, rgba(92,58,33,0.82) 0%, rgba(58,38,20,0.78) 50%, rgba(225,173,1,0.55) 100%), url("/images/(cocina-movil)/login-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Contenedor mobile-first con ancho máximo tipo teléfono/tablet */}
      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        {children}
      </div>

      {/* Footer minimal con identificación del subsistema */}
      <footer className="mt-8 text-center text-[11px] text-[#FFF8E7]/80 select-none relative z-10">
        <p>
          <strong className="font-semibold text-[#E1AD01]">
            El Amigo de las Pastas
          </strong>{' '}
          · Cocina Móvil
        </p>
        <p className="mt-0.5 italic text-[#FFF8E7]/65">
          Pastas artesanales con sabor a tradición
        </p>
        <p className="mt-1 text-[10px] text-[#FFF8E7]/50">
          Posadas · Misiones · Argentina
        </p>
      </footer>
    </main>
  )
}
