import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: {
    file: "../custom_components/bts_arrival_time/frontend/bts-arrival-card.js",
    format: "es",
    sourcemap: false,
  },
  plugins: [
    resolve(),
    typescript({ noEmit: false, include: ["src/**/*.ts"] }),
    terser({ format: { comments: false } }),
  ],
};
