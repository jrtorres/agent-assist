import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
// eslint-disable-next-line no-unused-vars
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    define: {
      "process.env.VITE_MQTT_CALLER_ID": JSON.stringify(
        env.VITE_MQTT_CALLER_ID,
      ),
      "process.env.VITE_WA_INTEGRATION_ID": JSON.stringify(
        env.VITE_WA_INTEGRATION_ID,
      ),
      "process.env.VITE_WA_REGION": JSON.stringify(env.VITE_WA_REGION),
      "process.env.VITE_WA_SERVICE_INSTANCE_ID": JSON.stringify(
        env.VITE_WA_SERVICE_INSTANCE_ID,
      ),
      "process.env.VITE_LOCAL_MICROSERVICES": JSON.stringify(
        env.VITE_LOCAL_MICROSERVICES,
      ),
      // "process.env.YOUR_BOOLEAN_VARIABLE": env.YOUR_BOOLEAN_VARIABLE,
      // If you want to exposes all env variables, which is not recommended
      // 'process.env': env
    },
    plugins: [react()],
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: "globalThis",
        },
      },
    },
    build: {
      minify: false,

      //experienced build issues with this rollup options
      // rollupOptions: {
      //   output: {
      //     manualChunks(id) {
      //       if (id.includes("node_modules")) {
      //         return id
      //           .toString()
      //           .split("node_modules/")[1]
      //           .split("/")[0]
      //           .toString();
      //       }
      //     },
      //   },
      // },
    },
    // take note! in dev mode, vite config proxies to localhost 8000 (api-server)
    server: {
      open: "/protected",
      proxy: {
        '/socket.io': {
          target: 'ws://localhost:8000',
          changeOrigin: true,
          ws: true,
        },
        '/agent' : {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
