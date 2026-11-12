"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, UserRound, ShoppingBag, ArrowUpRight } from "lucide-react";
const links = [
  ["/shop", "Shop"],
  ["/stoet", "Støt"],
  ["/abonnement", "Abonnement"],
  ["/om-os", "Om os"],
  ["/bryggeguide", "Bryggeguide"],
];
export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <>
      <div className="announcement">
        STOR KAFFEKÆRLIGHED <span>·</span> EN PRIS, FLERE KAN VÆRE MED PÅ{" "}
        <ArrowUpRight size={12} />
      </div>
      <header className="site-header">
        <Link
          href="/"
          className="brand"
          aria-label="Ristet Aalborg – forside"
          onClick={() => setOpen(false)}
        >
          <Image src="/images/logo.png" alt="" width={80} height={80} />
          <span>
            RISTET<span>AALBORG</span>
          </span>
        </Link>
        <nav aria-label="Hovednavigation" className="desktop-nav">
          {links.map(([href, label]) => (
            <Link
              aria-current={path.startsWith(href) ? "page" : undefined}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/konto" aria-label="Min konto">
            <UserRound size={20} />
          </Link>
          <Link
            href="/kurv"
            className="cart-link"
            aria-label="Indkøbskurv, 0 varer"
          >
            <ShoppingBag size={20} />
            <span>0</span>
          </Link>
          <button
            className="menu-toggle"
            aria-label={open ? "Luk menu" : "Åbn menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            aria-label="Mobilnavigation"
            className="mobile-nav"
          >
            {links.map(([href, label]) => (
              <Link href={href} key={href} onClick={() => setOpen(false)}>
                {label}
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
