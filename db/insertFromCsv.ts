import * as fs from "fs";
import { parse } from "csv-parse";
import sqlite3 from "sqlite3";
import { parseCsvDateString, getDateISO } from "../utils/dateFormatter";
import { showLoader } from "../utils/cliUi";
import { db } from "./connection.ts";
import type { Alojamiento } from "./types.ts";

function insertCsvToDb(
  db: sqlite3.Database,
  csvFilePath: string,
  loader: ReturnType<typeof showLoader>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const alojamientos: Alojamiento[] = [];
    const parser = parse({
      delimiter: ",",
      skipEmptyLines: true,
      columns: true,
    });

    fs.createReadStream(csvFilePath)
      .pipe(parser)
      .on("data", (row: Alojamiento) => {
        alojamientos.push({
          fecha: parseCsvDateString(row.fecha as unknown as string),
          cabE: row.cabE,
          cabO: row.cabO,
          hab1: row.hab1,
          hab2: row.hab2,
          hab3: row.hab3,
          hab4: row.hab4,
        });
      })
      .on("end", async () => {
        try {
          for (const alojamiento of alojamientos) {
            await insertAlojamiento(db, alojamiento);
          }
          loader.succeed("✅ Todos los registros insertados correctamente.");
          resolve();
        } catch (err: any) {
          loader.fail(`❌ Error al insertar datos: ${err.message}`);
          reject(err);
        } finally {
          loader.stop();
        }
      })
      .on("error", (err: any) => {
        reject(err);
      });
  });
}

function insertAlojamiento(
  db: sqlite3.Database,
  alojamiento: Alojamiento,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      "INSERT INTO alojamiento (fecha, cabE, cabO, hab1, hab2, hab3, hab4) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    const fechaISO = getDateISO(alojamiento.fecha);
    stmt.run(
      [
        fechaISO,
        alojamiento.cabE,
        alojamiento.cabO,
        alojamiento.hab1,
        alojamiento.hab2,
        alojamiento.hab3,
        alojamiento.hab4,
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
    stmt.finalize();
  });
}

const loader = showLoader(`Insert csv data to database... 📝`);

// Insertar datos desde el CSV
insertCsvToDb(db, "./db/dispo1.csv", loader)
  .then(() => {
    loader.succeed("✅ Proceso completado.");
    db.close();
  })
  .catch((err: any) => {
    loader.fail(`❌ Error en el proceso: ${err.message}`);
    db.close();
  });
