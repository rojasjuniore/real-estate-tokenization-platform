import Link from "next/link";
import { brandConfig } from "@/config/brand.config";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <BrandLogo variant="icon-only" width={32} height={32} />
              <span className="text-xl font-bold text-white">{brandConfig.identity.companyName}</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              Plataforma de tokenizacion de bienes raices que permite inversion
              fraccionada en propiedades inmobiliarias premium.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Plataforma</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/properties" className="text-gray-400 hover:text-white transition text-sm">
                  Propiedades
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-gray-400 hover:text-white transition text-sm">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition text-sm">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition text-sm">
                  Terminos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition text-sm">
                  Politica de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/risks" className="text-gray-400 hover:text-white transition text-sm">
                  Riesgos de Inversion
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} {brandConfig.legal.copyrightTemplate.replace('{companyName}', brandConfig.identity.companyName).replace('{appName}', brandConfig.identity.appName)}
            </p>
            <p className="text-gray-600 text-[10px] mt-1">
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-gray-500 text-sm">Powered by</span>
            <img src="https://cryptologos.cc/logos/polygon-matic-logo.png" alt="Polygon" className="h-5" />
          </div>
        </div>
      </div>
    </footer>
  );
}
