import type { Config } from "tailwindcss";

declare module "@opus/config/tailwind" {
  const preset: Config;
  export default preset;
}
