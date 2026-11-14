"use client";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { products, filterProducts, Filters } from "@/lib/catalog";
import { ProductCard } from "./product-card";
const initial: Filters = { origin: "", method: "", roast: "", maxPrice: 100 };
export function Catalog() {
  const [filters, setFilters] = useState(initial);
  const [sort, setSort] = useState("featured");
  const result = filterProducts(products, filters).sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name, "da")
      : sort === "price"
        ? a.variants[0].priceOre - b.variants[0].priceOre
        : 0,
  );
  const update = (key: keyof Filters, value: string | number) =>
    setFilters({ ...filters, [key]: value });
  return (
    <>
      <div className="filters">
        <span className="filter-title">
          <SlidersHorizontal size={17} /> Find din kaffe
        </span>
        <label>
          Oprindelse
          <select
            value={filters.origin}
            onChange={(e) => update("origin", e.target.value)}
          >
            <option value="">Alle lande</option>
            {[...new Set(products.map((product) => product.country))].map(
              (country) => (
                <option key={country}>{country}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Bryggemetode
          <select
            value={filters.method}
            onChange={(e) => update("method", e.target.value)}
          >
            <option value="">Alle metoder</option>
            <option>Espresso</option>
            <option>Filter</option>
          </select>
        </label>
        <label>
          Ristning
          <select
            value={filters.roast}
            onChange={(e) => update("roast", e.target.value)}
          >
            <option value="">Alle ristninger</option>
            <option>Lys</option>
            <option>Mellem</option>
            <option>Mørk</option>
          </select>
        </label>
        <label>
          Pris for 250 g
          <select
            value={filters.maxPrice}
            onChange={(e) => update("maxPrice", Number(e.target.value))}
          >
            <option value={100}>Op til 100 kr.</option>
            <option value={80}>Op til 80 kr.</option>
            <option value={70}>Op til 70 kr.</option>
          </select>
        </label>
        <button
          className="reset"
          onClick={() => {
            setFilters(initial);
            setSort("featured");
          }}
        >
          <X size={15} /> Nulstil
        </button>
      </div>
      <div className="results-bar">
        <span aria-live="polite">
          {result.length} kaffer · Udkast til sortiment
        </span>
        <label>
          Sortér efter{" "}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Udvalgte</option>
            <option value="name">Navn</option>
            <option value="price">Laveste pris</option>
          </select>
        </label>
      </div>
      {result.length ? (
        <div className="product-grid">
          {result.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Ingen kaffe med de valg.</h2>
          <p>Prøv en anden kombination, eller nulstil filtrene.</p>
          <button className="button dark" onClick={() => setFilters(initial)}>
            Vis alle kaffer
          </button>
        </div>
      )}
    </>
  );
}
