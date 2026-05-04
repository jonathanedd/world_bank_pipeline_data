import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, Globe, Activity, Download, Loader2 } from "lucide-react";
import { macroApi } from "./services/api";

//Components import
import WorldMap from "./Components/WorldMap";

const INDICATORS = [
  { code: "FP.CPI.TOTL.ZG", name: "Inflation (%)" },
  { code: "NY.GDP.MKTP.KD.ZG", name: "GDP Growth (%)" },
  { code: "SL.UEM.TOTL.ZS", name: "Unemployment (%)" },
  { code: "NY.GDP.MKTP.CD", name: "Total GDP (USD)" },
  { code: "SP.POP.TOTL", name: "Total Population" },
];

function App() {
  const [topData, setTopData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [snapshotData, setSnapshotData] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);

  const [year, setYear] = useState(2022);
  const [primaryCountry, setPrimaryCountry] = useState("COL");
  const [secondaryCountry, setSecondaryCountry] = useState("USA");
  const [selectedMetric, setSelectedMetric] = useState(INDICATORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  //Estado para el mapa
  const [mapData, setMapData] = useState([]);

  // Indicadores donde un aumento es considerado NEGATIVO (Rojo)
  const NEGATIVE_IF_INCREASES = ["FP.CPI.TOTL.ZG", "SL.UEM.TOTL.ZS"];

  // 1. Initial Load for Metadata
  useEffect(() => {
    const init = async () => {
      const yr = await macroApi.getAvailableYears();
      const ct = await macroApi.getAvailableCountries();
      if (yr.success) setAvailableYears(yr.data);
      if (ct.success) setAvailableCountries(ct.data);
    };
    init();
  }, []);

  // 2. Main Data Fetching (Synced with new Backend Aliases)
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        // TOP 10 - Uses 'getTopMetrics' and expects 'COUNTRY' / 'VALUE'
        const resTop = await macroApi.getTopMetrics(year, selectedMetric.code);
        setTopData(resTop.data || []);

        // TREND - Uses 'YEAR' and 'VALUE' for formatting
        const resTrend = await macroApi.getTrend(
          `${primaryCountry},${secondaryCountry}`,
          selectedMetric.code,
        );
        setTrendData(
          formatTrendData(
            resTrend.data || [],
            primaryCountry,
            secondaryCountry,
          ),
        );

        // SNAPSHOT - Expects 'INDICATOR_NAME' and 'VALUE'
        const resSnap = await macroApi.getSnapshot(primaryCountry, year);
        setSnapshotData(resSnap.data || []);

        const mapRes = await macroApi.getMapData(year, selectedMetric.code);
        if (mapRes.success) {
          setMapData(mapRes.data || []);
        }
      } catch (e) {
        console.error("Dashboard Fetch Error:", e);
      }
      setIsLoading(false);
    };
    fetchAll();
  }, [year, primaryCountry, secondaryCountry, selectedMetric]);

  // Formatting helper for the Comparison Chart
  const formatTrendData = (raw, c1, c2) => {
    const years = [...new Set(raw.map((d) => d.YEAR))];
    return years.map((y) => ({
      yearLabel: y,
      [c1]: raw.find((d) => d.YEAR === y && d.ISO_CODE === c1)?.VALUE,
      [c2]: raw.find((d) => d.YEAR === y && d.ISO_CODE === c2)?.VALUE,
      // MA solo para el país primario para no saturar la gráfica
      [`${c1}_MA`]: raw.find((d) => d.YEAR === y && d.ISO_CODE === c1)
        ?.MOVING_AVG,
    }));
  };

  return (
    <div className="min-h-screen bg-darkBg p-4 md:p-8 font-sans text-textPearl">
      {/* 1. Header: Fixed and responsive */}
      <header className="mb-10 border-b border-gray-800 pb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="text-accentGold" size={32} /> Global Macro Tracker
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Powered by Snowflake & World Bank API
          </p>
        </div>

        <div className="bg-darkCard p-2 rounded-xl border border-gray-700 flex flex-wrap gap-4 items-center">
          {/* Metric Selector */}
          <select
            value={selectedMetric.code}
            onChange={(e) =>
              setSelectedMetric(
                INDICATORS.find((i) => i.code === e.target.value),
              )
            }
            className="bg-transparent font-bold text-accentGold outline-none"
          >
            {INDICATORS.map((i) => (
              <option key={i.code} value={i.code} className="bg-darkCard">
                {i.name}
              </option>
            ))}
          </select>

          {/* Country 1 Selector */}
          <select
            value={primaryCountry}
            onChange={(e) => setPrimaryCountry(e.target.value)}
            className="bg-transparent border-l border-gray-600 pl-4 outline-none"
          >
            {availableCountries.map((c) => (
              <option
                key={c.ISO_CODE}
                value={c.ISO_CODE}
                className="bg-darkCard"
              >
                {c.COUNTRY_NAME}
              </option>
            ))}
          </select>

          {/* Country 2 Selector */}
          <select
            value={secondaryCountry}
            onChange={(e) => setSecondaryCountry(e.target.value)}
            className="bg-transparent border-l border-gray-600 pl-4 text-accentOrange outline-none"
          >
            {availableCountries.map((c) => (
              <option
                key={c.ISO_CODE}
                value={c.ISO_CODE}
                className="bg-darkCard"
              >
                {c.COUNTRY_NAME}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-transparent border-l border-gray-600 pl-4 font-bold outline-none"
          >
            {availableYears.map((y) => (
              <option key={y} value={y} className="bg-darkCard">
                {y}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* 2. KPI Cards: AQUÍ ES DONDE APLICAMOS EL FIX */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {snapshotData
          // ORDENAMOS los datos antes de dibujarlos
          .sort((a, b) => {
            const indexA = INDICATORS.findIndex(
              (i) => i.code === a.INDICATOR_CODE,
            );
            const indexB = INDICATORS.findIndex(
              (i) => i.code === b.INDICATOR_CODE,
            );
            return indexA - indexB;
          })
          .map((kpi, idx) => {
            const diff = kpi.PREVIOUS_VALUE
              ? ((kpi.VALUE - kpi.PREVIOUS_VALUE) / kpi.PREVIOUS_VALUE) * 100
              : null;

            const isPositiveDiff = diff > 0;

            // Lógica de colores semántica
            let colorClass = "text-gray-400";
            if (diff !== null && diff !== 0) {
              if (NEGATIVE_IF_INCREASES.includes(kpi.INDICATOR_CODE)) {
                // Inflación o Desempleo: Subir (isPositiveDiff) es MALO (Rojo)
                colorClass = isPositiveDiff ? "text-red-400" : "text-green-400";
              } else {
                // PIB o Población: Subir (isPositiveDiff) es BUENO (Verde)
                colorClass = isPositiveDiff ? "text-green-400" : "text-red-400";
              }
            }

            return (
              <div
                key={kpi.INDICATOR_CODE || idx}
                className="bg-darkCard p-4 rounded-xl border border-gray-800 shadow-md flex flex-col justify-between min-h-[120px]"
              >
                <span className="text-gray-400 text-[10px] block mb-2 uppercase tracking-wider font-bold h-8">
                  {kpi.INDICATOR_NAME}
                </span>

                <div className="flex flex-col">
                  <span className="text-textPearl text-2xl font-bold">
                    {kpi.VALUE
                      ? parseFloat(kpi.VALUE).toLocaleString("en-US", {
                          maximumFractionDigits: 1,
                        })
                      : "N/A"}
                  </span>

                  {diff !== null && diff !== 0 && (
                    <div
                      className={`flex items-center gap-1 text-xs mt-2 font-bold ${colorClass}`}
                    >
                      <span>{isPositiveDiff ? "▲" : "▼"}</span>
                      <span>{Math.abs(diff).toFixed(1)}% vs Prev Year</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <div className="mb-12 w-full block">
        <WorldMap
          data={mapData}
          metricName={selectedMetric.name}
          onCountryClick={(iso) => setPrimaryCountry(iso)}
        />
      </div>

      {/* 4. Comparison & Top 10: Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        {/* Historical Comparison */}
        <div className="bg-darkCard p-6 rounded-xl border border-gray-800 relative min-h-[450px]">
          {isLoading && (
            <Loader2 className="absolute top-4 right-4 animate-spin text-accentGold" />
          )}
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-accentGold" />
            <h2 className="text-xl font-semibold">Historical Comparison</h2>
          </div>
          <div style={{ width: "100%", height: "350px" }}>
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid stroke="#2d2d2d" vertical={false} />
                <XAxis dataKey="yearLabel" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E1E1E",
                    borderColor: "#374151",
                  }}
                />
                <Legend />

                <Line
                  type="monotone"
                  dataKey={primaryCountry}
                  stroke="#F7C548"
                  strokeWidth={3}
                  dot={false}
                  name={primaryCountry}
                />
                <Line
                  type="monotone"
                  dataKey={secondaryCountry}
                  stroke="#FF6B35"
                  strokeWidth={3}
                  dot={false}
                  name={secondaryCountry}
                />

                {/* Línea de tendencia (Media Móvil) */}
                <Line
                  type="monotone"
                  dataKey={`${primaryCountry}_MA`}
                  stroke="#F7C548"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`${primaryCountry} Trend (MA)`}
                  opacity={0.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Top 10 */}
        <div className="bg-darkCard p-6 rounded-xl border border-gray-800 relative min-h-[450px]">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-accentOrange" />
            <h2 className="text-xl font-semibold">
              Global Top 10: {selectedMetric.name}, {year}
            </h2>
          </div>
          <div style={{ width: "100%", height: "350px" }}>
            <ResponsiveContainer>
              <BarChart data={topData} layout="vertical">
                <XAxis type="number" stroke="#6b7280" />
                <YAxis
                  dataKey="COUNTRY"
                  type="category"
                  width={100}
                  stroke="#E0E0E0"
                  fontSize={10}
                />
                <Tooltip
                  cursor={{ fill: "#2d2d2d" }}
                  contentStyle={{
                    backgroundColor: "#1E1E1E",
                    borderColor: "#374151",
                  }}
                  itemStyle={{ color: "#FF6B35", fontWeight: "bold" }}
                />
                <Bar dataKey="VALUE" radius={[0, 4, 4, 0]}>
                  {topData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#FF6B35" : "#F7C548"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
