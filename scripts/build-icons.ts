// scripts/build-icons.ts

import {
  importDirectory,
  cleanupSVG,
  parseColors,
  isEmptyColor,
} from "@iconify/tools";
import fs from "fs/promises";
import path from "path";

async function buildIcons() {
  try {
    const iconsPath = path.resolve(__dirname, "../icons/banks");

    // Importa os SVGs da pasta
    const iconSet = await importDirectory(iconsPath, {
      prefix: "bank", // ex: bank:itau, bank:bradesco
    });

    // Cria array com todos os nomes de ícones
    const names: string[] = [];
    iconSet.forEach((name, type) => {
      if (type === "icon") names.push(name);
    });

    // Processa cada ícone sequencialmente
    for (const name of names) {
      const svg = iconSet.toSVG(name);
      if (!svg) {
        iconSet.remove(name);
        continue;
      }

      // Normaliza cores
      await parseColors(svg, {
        defaultColor: "currentColor",
        callback: (attr, colorStr, color) => {
          if (!color || isEmptyColor(color)) {
            return "currentColor";
          }
          return colorStr;
        },
      });

      // Limpa o SVG
      cleanupSVG(svg);

      // Atualiza no set
      iconSet.fromSVG(name, svg);
    }

    // Exporta como JSON
    const output = path.resolve(__dirname, "../public/bank-icons.json");
    await fs.writeFile(
      output,
      JSON.stringify(iconSet.export(), null, 2),
      "utf8"
    );

    console.log(`✅ Conjunto de ícones gerado em: ${output}`);
  } catch (err) {
    console.error("❌ Erro ao gerar ícones:", err);
  }
}

buildIcons();
