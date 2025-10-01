// scripts/build-icons.js

const {
  importDirectory,
  cleanupSVG,
  parseColors,
  isEmptyColor,
} = require("@iconify/tools");
const fs = require("fs/promises");
const path = require("path");

async function buildIcons() {
  try {
    const iconsPath = path.resolve(__dirname, "../icons/banks");

    const iconSet = await importDirectory(iconsPath, {
      prefix: "bank",
    });

    const names = [];
    iconSet.forEach((name, type) => {
      if (type === "icon") names.push(name);
    });

    for (const name of names) {
      const svg = iconSet.toSVG(name);
      if (!svg) {
        iconSet.remove(name);
        continue;
      }

      await parseColors(svg, {
        defaultColor: "currentColor",
        callback: (attr, colorStr, color) => {
          if (!color || isEmptyColor(color)) return "currentColor";
          return colorStr;
        },
      });

      cleanupSVG(svg);
      iconSet.fromSVG(name, svg);
    }

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
