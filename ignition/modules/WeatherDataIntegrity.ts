import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WeatherDataIntegrityModule = buildModule(
  "WeatherDataIntegrityModule",
  (m) => {
    const weatherDataIntegrity = m.contract("WeatherDataIntegrity");

    return { weatherDataIntegrity };
  },
);

export default WeatherDataIntegrityModule;
