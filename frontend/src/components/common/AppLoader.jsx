import { FourSquare } from "react-loading-indicators";
import "./appLoader.css";

const loaderColors = ["#222422", "#3b3e3b", "#545854", "#6d726d"];

export default function AppLoader({ label = "Loading...", variant = "inline" }) {
  if (variant === "fullscreen") {
    return (
      <div className="appLoader appLoaderFull">
        <FourSquare color={loaderColors} />
        <span>{label}</span>
      </div>
    );
  }

  if (variant === "button") {
    return (
      <span className="appLoader appLoaderButton">
        <FourSquare color={loaderColors} />
        <span>{label}</span>
      </span>
    );
  }

  if (variant === "table") {
    return (
      <span className="appLoader appLoaderTable">
        <FourSquare color={loaderColors} />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className="appLoader appLoaderInline">
      <FourSquare color={loaderColors} />
      <span>{label}</span>
    </span>
  );
}

