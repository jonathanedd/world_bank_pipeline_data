import React, { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";

// Usaremos este GeoJSON que usa códigos ISO de 3 letras (COL, USA, etc) como ID principal
const geoUrl = import.meta.env.VITE_GEO_URL;

const WorldMap = ({ data, metricName, year, onCountryClick }) => {
  const [tooltip, setTooltip] = useState("");

  // Calculamos el valor máximo basado en la data real que mostraste
  const maxVal = useMemo(() => {
    if (!data || data.length === 0) return 100;
    const values = data
      .map((d) => parseFloat(d.VALUE))
      .filter((v) => !isNaN(v));
    return values.length > 0 ? Math.max(...values) : 100;
  }, [data]);

  const colorScale = scaleLinear()
    .domain([0, maxVal])
    .range(["#2d2d2d", "#F7C548"]); // De gris oscuro a Oro

  return (
    <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-lg relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-textPearl">
          Global Heatmap: {metricName}, {year}
        </h2>
        {tooltip && (
          <div className="bg-accentGold text-black px-3 py-1 rounded-md text-sm font-bold shadow-lg z-20">
            {tooltip}
          </div>
        )}
      </div>

      {/* Mantenemos tus dimensiones exactas */}
      <div className="h-[450px] w-full bg-[#151515] rounded-lg flex items-center justify-center overflow-hidden cursor-crosshair">
        <ComposableMap
          width={800}
          height={400}
          projectionConfig={{ scale: 140, center: [0, 5] }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup center={[0, 0]} maxZoom={3}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // En este mapa específico, el ID ya es 'COL', 'USA', 'AFG', etc.
                  const geoIso = geo.id;

                  // Buscamos el match exacto con tu console.log
                  const countryData = data.find((d) => d.ISO_CODE === geoIso);
                  const value = countryData
                    ? parseFloat(countryData.VALUE)
                    : null;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        const valText =
                          value !== null ? value.toLocaleString() : "No data";
                        setTooltip(`${geo.properties.name}: ${valText}`);
                      }}
                      onMouseLeave={() => setTooltip("")}
                      onClick={() => {
                        if (countryData) onCountryClick(geoIso);
                      }}
                      // Si hay match, se pinta. Si no, se queda gris oscuro.
                      fill={value !== null ? colorScale(value) : "#1f1f1f"}
                      stroke="#121212"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none", transition: "all 250ms" },
                        hover: {
                          fill: "#FF6B35",
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: { fill: "#FF6B35", outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>
    </div>
  );
};

export default WorldMap;
