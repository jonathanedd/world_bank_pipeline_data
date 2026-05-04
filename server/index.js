import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import snowflake from "snowflake-sdk";

// Load environment variables
dotenv.config();

const app = express();

// En tu server/index.js
const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

// Middlewares
app.use(cors());
app.use(express.json());

// Snowflake connection configuration
const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
});

// Connect to Snowflake
connection.connect((err, conn) => {
  if (err) {
    console.error("Unable to connect to Snowflake: " + err.message);
  } else {
    console.log("Successfully connected to Snowflake. ID:", conn.getId());
  }
});

/**
 * ------------------------------------------------------------------------------------------------
 * ENDPOINTS
 * ------------------------------------------------------------------------------------------------
 */

// 1. GENERIC TOP 10 ENDPOINT (Now supports any indicator)
app.get("/api/top/:year/:indicatorCode", (req, res) => {
  const { year, indicatorCode } = req.params;

  const sqlQuery = `
        SELECT 
            c.COUNTRY_NAME AS COUNTRY, 
            c.ISO_CODE,
            f.VALUE
        FROM FACT_MACRO_METRICS f
        JOIN DIM_COUNTRIES c ON f.COUNTRY_ID = c.COUNTRY_ID
        JOIN DIM_INDICATORS i ON f.INDICATOR_ID = i.INDICATOR_ID
        WHERE i.INDICATOR_CODE = ? 
          AND f.YEAR = ?
        ORDER BY f.VALUE DESC
        LIMIT 10;
    `;

  connection.execute({
    sqlText: sqlQuery,
    binds: [indicatorCode.toUpperCase(), year],
    complete: (err, stmt, rows) => {
      if (err) {
        console.error("Error in Top 10 Query:", err.message);
        res.status(500).json({ success: false, error: "Database query error" });
      } else {
        res.json({ success: true, year, indicatorCode, data: rows });
      }
    },
  });
});

// 2. MULTI-COUNTRY TREND ENDPOINT
// index.js - Updated Trend Endpoint
app.get("/api/trend/:isoCodes/:indicatorCode", (req, res) => {
  const codes = req.params.isoCodes.toUpperCase().split(",");
  const indicatorCode = req.params.indicatorCode.toUpperCase();
  const placeholders = codes.map(() => "?").join(",");

  const sqlQuery = `
        SELECT 
            c.ISO_CODE, 
            f.YEAR, 
            f.VALUE,
            -- Snowflake Analytic Function: 3-Year Moving Average
            AVG(f.VALUE) OVER (
                PARTITION BY c.ISO_CODE 
                ORDER BY f.YEAR 
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ) AS MOVING_AVG
        FROM FACT_MACRO_METRICS f
        JOIN DIM_COUNTRIES c ON f.COUNTRY_ID = c.COUNTRY_ID
        JOIN DIM_INDICATORS i ON f.INDICATOR_ID = i.INDICATOR_ID
        WHERE c.ISO_CODE IN (${placeholders}) 
          AND i.INDICATOR_CODE = ?
        ORDER BY f.YEAR ASC;
    `;

  connection.execute({
    sqlText: sqlQuery,
    binds: [...codes, indicatorCode],
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    },
  });
});

// 3. MACROECONOMIC SNAPSHOT ENDPOINT (All indicators for one country/year)
app.get("/api/snapshot/:isoCode/:year", (req, res) => {
  const isoCode = req.params.isoCode.toUpperCase();
  const year = req.params.year;

  const sqlQuery = `
    WITH MetricsData AS (
        SELECT 
            i.INDICATOR_NAME,
            i.INDICATOR_CODE,
            f.YEAR,
            f.VALUE,
            LAG(f.VALUE) OVER (PARTITION BY i.INDICATOR_CODE ORDER BY f.YEAR) AS PREVIOUS_VALUE
        FROM FACT_MACRO_METRICS f
        JOIN DIM_COUNTRIES c ON f.COUNTRY_ID = c.COUNTRY_ID
        JOIN DIM_INDICATORS i ON f.INDICATOR_ID = i.INDICATOR_ID
        WHERE c.ISO_CODE = ?
    )
    SELECT * FROM MetricsData WHERE YEAR = ?;
  `;

  connection.execute({
    sqlText: sqlQuery,
    binds: [isoCode, year],
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows }); // Importante: enviamos 'data'
    },
  });
});

// 4. GET AVAILABLE YEARS
app.get("/api/years", (req, res) => {
  const sqlQuery = `SELECT DISTINCT YEAR FROM FACT_MACRO_METRICS ORDER BY YEAR DESC;`;

  connection.execute({
    sqlText: sqlQuery,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error("Error in Years Query:", err.message);
        return res
          .status(500)
          .json({ success: false, error: "Error fetching years" });
      }
      const years = rows.map((row) => row.YEAR);
      res.json({ success: true, data: years });
    },
  });
});

// 5. GET AVAILABLE COUNTRIES
app.get("/api/countries", (req, res) => {
  const sqlQuery = `SELECT ISO_CODE, COUNTRY_NAME FROM DIM_COUNTRIES ORDER BY COUNTRY_NAME ASC;`;

  connection.execute({
    sqlText: sqlQuery,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error("Error in Countries Query:", err.message);
        return res
          .status(500)
          .json({ success: false, error: "Error fetching countries" });
      }
      res.json({ success: true, data: rows });
    },
  });
});

// 6. GLOBAL DATA FOR MAP
// Endpoint para los datos del mapa global
app.get("/api/map/:year/:indicatorCode", (req, res) => {
  const { year, indicatorCode } = req.params;

  const sqlQuery = `
    SELECT 
        c.ISO_CODE, 
        f.VALUE
    FROM FACT_MACRO_METRICS f
    JOIN DIM_COUNTRIES c ON f.COUNTRY_ID = c.COUNTRY_ID
    JOIN DIM_INDICATORS i ON f.INDICATOR_ID = i.INDICATOR_ID
    WHERE f.YEAR = ? AND i.INDICATOR_CODE = ?;
  `;

  connection.execute({
    sqlText: sqlQuery,
    binds: [year, indicatorCode.toUpperCase()],
    complete: (err, stmt, rows) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    },
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
