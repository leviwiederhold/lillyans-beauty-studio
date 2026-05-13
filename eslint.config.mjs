import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    ignores: [".next/**", "node_modules/**"],
    rules: {
      "react-hooks/purity": "off"
    }
  }
];

export default config;
